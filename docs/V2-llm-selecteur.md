# Billy — Sélecteur de répliques hybride (LLM contraint)

> **Statut : implémenté côté code, NON validé par les pros.** Cette note décrit l'architecture
> qui permet à Billy de « parler beaucoup plus » sans rompre les garde-fous du cadrage Option A.
> Le périmètre fonctionnel reste celui d'Option A (support & orientation, pas d'interrogatoire).

## 1. Le besoin

Pour une V1 présentable à des associations, Billy doit paraître **vivant et réactif**, pas réciter
une liste figée. La V1 d'origine jouait ~25 phrases dans un ordre fixe → impression robotique.

## 2. Le choix : « le LLM CHOISIT, il n'INVENTE jamais »

On introduit un LLM **uniquement comme sélecteur**. À chaque tour il reçoit :
- la phase NICHD courante et son objectif,
- les derniers échanges,
- ce que l'enfant vient de dire,
- un **menu** : la liste des répliques **pré-validées** de la phase (un `id` + un `intent` court).

Il renvoie un **choix structuré** (via `tool_use` forcé, température 0) :

```json
{ "action": "say|cued_invitation|open",
  "phraseId": "P4-2", "cuedWord": "dinosaure",
  "nextPhase": "P7", "signal": "none|distress|disclosure|danger" }
```

Il ne produit **aucun texte prononcé**. Son espace de sortie est :

```
{ répliques du répertoire signé }  ∪  { invitation reprenant un mot DIT par l'enfant }
```

## 3. Pourquoi c'est sûr (argument de sécurité)

1. **Espace de sortie fini et pré-audité.** Un `say` ne peut désigner qu'un `id` du menu de la
   phase courante. Toutes les phrases neutres du répertoire passent `audit()` — garanti par le test
   `src/safety/script-coherence.test.js`. Un `id` halluciné / d'une autre phase → **fail-closed**.
2. **La seule entrée de mots de l'enfant** est la *cued-invitation* (« Tu as parlé de X. Raconte-moi
   ça. »). Elle passe par `evaluate()` (allow-list, exception cued) qui exige : `X` ∈ lexique de
   l'enfant **et** `X` non-tabou. Sinon → fail-closed.
3. **Double rempart avant la voix.** Le serveur renvoie un texte déjà validé ; le front le repasse
   une 2ᵉ fois par `audit()` (défense en profondeur).
4. **Le LLM ne pilote pas la révélation.** Sur tout `signal`, le serveur **impose** la séquence
   Option A : réassurance sans qualifier → clôture → 119. Le LLM ne peut que *déclencher* cette
   séquence, jamais l'orienter.
5. **Jailbreak sans effet.** Même manipulé, le LLM ne peut que choisir une phrase sûre du menu ou
   déclencher l'arrêt+orientation. Il n'a aucun moyen de faire prononcer un mot neuf à Billy.
6. **Clé jamais exposée.** L'appel LLM est **serveur** (`ANTHROPIC_API_KEY` en env). Sans clé →
   repli déterministe ; la démo fonctionne hors-ligne.

> En clair : on ne lève **pas** le VETO « LLM libre face à l'enfant » du cadrage. Le LLM est ici un
> aiguilleur sur un espace clos, pas un générateur. C'est compatible Option A.

## 4. Composants

| Fichier | Rôle |
|---|---|
| `public/content/script-billy.json` | Répertoire fermé élargi + champ `intent` + bloc `selecteur` |
| `src/conversation/selector.js` | `buildMenu`, `chooseNext`, repli déterministe, `finalize` fail-closed |
| `src/conversation/llm.js` | Appel Anthropic (tool_use forcé, temp 0, timeout) → choix structuré ; sans clé → `null` |
| `src/server/index.js` | `POST /api/next` : reçoit l'état, renvoie un **texte validé** + `expectsChild`/`signal`/`nextPhase` |
| `public/js/session.js` | Boucle de séance pilotée par `/api/next`, repli local, signal → 119 |
| `src/conversation/selector.test.js` | 14 tests : id valide, fail-closed (id halluciné/hors-phase), cued (lexique/tabou), signal, JSON cassé |

## 5. Configuration

`.env` : `ANTHROPIC_API_KEY` + `BILLY_LLM_MODEL` (défaut `claude-haiku-4-5` — le sélecteur ne fait que choisir une réplique, Haiku suffit et coûte ~5× moins). Voir `.env.example`.

## 6. Ce qui reste un GATE (pas du code)

- **Validation pro du répertoire élargi** (v0.2) : statuts `brouillon`/`proposé` → `validé` par
  pédopsychiatrie petite enfance, audition/NICHD, juriste, pédiatre.
- **Validation de la POLITIQUE de sélection** : le risque résiduel n'est plus « Billy invente un mot
  suggestif » (impossible) mais « le LLM enchaîne des phrases sûres d'une manière subtilement
  orientée/insistante ». À éprouver par red-team dédiée (enchaînements, répétition, pression
  implicite) et à border par les pros. Tant que non validé : garder la démo en **phases neutres**.
- **DPA fournisseur LLM (UE)** et mise à jour **DPIA** : l'énoncé de l'enfant transite par l'API du
  fournisseur → base légale + minimisation + pas d'entraînement sur la parole de l'enfant à border.
- **Synchroniser l'allow-list signée** (`APPROVED_RAW` dans `antiSuggestion.js`) avec le répertoire
  validé, pour que `evaluate()` (et pas seulement `audit()`) couvre 100 % des répliques en prod.
