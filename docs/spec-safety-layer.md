# Spécification — couche sûreté `src/safety/` (filtre anti-suggestion)

> Statut : **spec V1 + implémentation de référence** (`src/safety/antiSuggestion.js` + tests).
> ⚠️ Heuristiques **à valider et compléter par les professionnels** (expert audition NICHD,
> pédopsychiatre) avant tout usage réel. Les lexiques (tabou, personnes, lieux) sont des
> **données de configuration** maintenues et signées par les pros, pas figées dans le code.

> **Mise à jour post red-team (cf. `docs/redteam-rapport-V1.md`, F-12).** Le rempart runtime
> n'est PAS la liste noire de règles (une blacklist ne peut garantir « 0 faux négatif »), mais
> une **allow-list** : en Option A, l'espace de sortie de Billy est fini (le répertoire signé),
> donc on valide par **identité au répertoire** (`evaluate`/`evaluateOutput`). Les 12+ règles
> (`audit`) servent de **défense en profondeur et de lint du répertoire**. Le code reflète cela.

## 1. Rôle et garanties

Le **rempart runtime** (`evaluate`) est une **allow-list** : un texte ne part au TTS que s'il
est **identique à une réplique du répertoire signé** (ou une cued-invitation dont le mot vient
de l'enfant). Tout le reste est `BLOCK`. La couche `audit` (12+ règles) s'applique en
**défense secondaire** et pour **auditer le répertoire** avant signature.

- **Verdict binaire** : `PASS` ou `BLOCK`, avec `ruleId` + `reason` (pour audit et tests).
- **Fail-closed** : toute erreur, ambiguïté ou exception ⇒ `BLOCK`, et le moteur se replie sur
  une **invitation neutre pré-validée** (« Et après ? » / « Dis-m'en plus. »).
- **Sans état partagé hors session** : le filtre raisonne sur l'**état de session** fourni
  (lexique de l'enfant, questions déjà posées, dernier énoncé enfant). Aucune donnée enfant
  n'est persistée par le filtre.

## 2. Contrat d'API

```js
evaluate(candidateText, sessionState) -> { decision: 'PASS'|'BLOCK', ruleId, reason }
```

`sessionState` :
- `childLexicon` : `Set<string>` des **lemmes/mots réellement prononcés par l'enfant** depuis
  le début de la session (alimenté à chaque énoncé enfant, après normalisation).
- `lastChildUtterance` : `string` — dernier énoncé de l'enfant (pour la règle 11).
- `askedQuestions` : `string[]` — questions déjà posées par Billy (normalisées, pour la règle 9).

Principe transversal : **Billy ne nomme jamais en premier** un acte, une partie du corps, un
lieu ou un auteur. Tout terme « sensible » **absent du `childLexicon`** est bloqué.

## 3. Les 12 règles (toutes testables)

| # | ruleId | Bloque quand… | Exemple bloqué |
|---|--------|---------------|----------------|
| 1 | `TABOO_LEXICON` | un acte / partie du corps / terme d'abus **hors `childLexicon`** apparaît | « il t'a touché le zizi ? » |
| 2 | `NAME_PERPETRATOR` | une personne/rôle est désignée comme acteur, **hors `childLexicon`** | « est-ce que papa… » |
| 3 | `NAME_PLACE` | un lieu **hors `childLexicon`** est introduit | « c'était dans la chambre ? » |
| 4 | `CLOSED_YESNO` | question fermée oui/non (« est-ce que… ? », inversion, « …, hein ? ») | « tu avais peur ? » |
| 5 | `SUGGESTIVE_TAG` | tag de confirmation (« c'est bien ça ? », « pas vrai ? ») | « …, c'est bien ça ? » |
| 6 | `PRESUPPOSITION` | présuppose un fait non établi | « quand il t'a fait ça… » |
| 7 | `FORCED_CHOICE` | choix forcé « X ou Y ? » | « c'était le jour ou la nuit ? » |
| 8 | `PRESSURE` | pression/insistance | « tu es sûr ? », « réfléchis bien » |
| 9 | `REPEAT_QUESTION` | même question déjà posée dans la session | (répétition d'une fermée) |
| 10 | `CONDITIONAL_REWARD` | récompense conditionnée à une réponse | « si tu me dis, tu auras un bonbon » |
| 11 | `ENRICHED_REFORMULATION` | une relance « citée » introduit un détail **absent** du dernier énoncé enfant | « tu as parlé du garage » (jamais dit) |
| 12 | `EMOTIONAL_LABEL` | impose un vécu / qualifie émotionnellement | « ça a dû te faire peur, hein ? » |

Ordre d'évaluation : 1→12, **premier `BLOCK` gagne**. Si toutes passent ⇒ `PASS`.

## 4. Conformité attendue (critères de tests)

- Le **répertoire fermé** (`docs/repertoire-formulations_V1.md`) doit être **100 % `PASS`**.
- Le **corpus de contre-exemples** (un par règle, au minimum) doit être **100 % `BLOCK`**
  avec le bon `ruleId`.
- **Zéro fuite tolérée** : objectif 100 %, pas 99 % (exigence du veto éthique).
- Test de **fail-closed** : entrée invalide / exception ⇒ `BLOCK`.

## 5. Limites assumées (V1)

- Heuristiques regex + lexiques : **ne remplacent pas** un jugement clinique. Faux positifs
  acceptables (on préfère bloquer à tort) ; **faux négatifs inacceptables** sur le sensible.
- Le NLU fin (lemmatisation complète, désambiguïsation) est un chantier V2. En V1, on
  **compense par le répertoire fermé** : Billy ne génère pas librement, donc l'espace des
  sorties est petit et entièrement testable.
- Les lexiques sensibles sont **hors dépôt applicatif** (config signée par les pros).
