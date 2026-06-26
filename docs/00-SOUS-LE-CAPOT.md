# Billy — Sous le capot : méthodes, sources & moteur de dialogue

> **À qui s'adresse ce document ?** À toi (Ben), aux professionnels qui valident, et à
> toute personne qui doit comprendre **d'où vient ce que Billy dit** et **pourquoi il ne
> peut structurellement pas déraper**. C'est le document de référence « comment ça marche ».
>
> Il répond précisément à deux peurs légitimes :
> 1. **« Une hallucination de l'IA pourrait déclarer qu'une phrase est OK alors qu'elle ne l'est pas. »**
>    → Voir **§5**. Réponse courte : *ce n'est pas l'IA qui décide si une phrase est OK.*
> 2. **« Je ne sais pas ce qu'il y a sous le capot du moteur de dialogue. »**
>    → Voir **§3 et §4**. On déroule le pipeline ligne par ligne, fichier par fichier.

---

## 1. L'idée-force en une page

Billy parle à un enfant de 2-5 ans potentiellement victime de violence. Dans ce contexte,
**une seule phrase mal formulée peut nuire à l'enfant et détruire la valeur judiciaire de sa
parole**. On ne peut donc pas se permettre « 99 % de phrases correctes ». Il faut **0 fuite**.

Or aucune IA générative ne garantit 0 fuite : par construction, un modèle de langage *invente*
du texte, et peut donc inventer une mauvaise phrase. **La décision de fond du projet est donc de
ne JAMAIS laisser une IA rédiger ce que Billy dit à l'enfant.**

À la place, deux principes :

| Principe | Conséquence concrète |
|---|---|
| **Répertoire fermé** | Tout ce que Billy peut prononcer est écrit à l'avance, dans un fichier (`script-billy.json`), et **validé/signé par les professionnels**. L'espace des phrases possibles est **fini et entièrement testable**. |
| **L'IA choisit, elle ne rédige pas** | Le modèle de langage (Claude) sert seulement à **choisir** quelle phrase pré-validée jouer ensuite — il rend un **identifiant**, jamais du texte. Et même ce choix **repasse par un filtre déterministe** avant d'être prononcé. |

C'est ce qu'on appelle l'**Option A** (décision de cadrage du 21/06/2026) et l'approche
**« LLM-sélecteur »** (et non « LLM libre »). Le veto « pas de LLM qui génère du texte face à
l'enfant » **n'est pas levé** et ne le sera pas en V1.

---

## 2. Les méthodes intégrées — d'où vient la posture

La posture de Billy n'est pas inventée. Chaque règle vient d'une source reconnue. Voici la
**traçabilité méthode → source → endroit dans le code/contenu**.

### 2.1 Le socle : le protocole NICHD

Le **NICHD** (*National Institute of Child Health and Human Development*) est le protocole
d'audition d'enfants le plus validé scientifiquement au monde. Principe : **plus une question
est ouverte, plus la réponse est fiable ; plus elle est fermée/suggestive, plus la parole est
contaminée et inexploitable.**

On en a tiré **deux choses concrètes** :

**(a) La hiérarchie des questions** — codée comme une règle de tri du plus fiable au moins
fiable (`docs/protocole-entretien-NICHD.md`) :

1. **Invitations** (« Raconte-moi… », « Et après ? ») ✅ privilégiées
2. **Relances sur les mots DÉJÀ dits par l'enfant** (« Tu as parlé de *[son mot]*, raconte-moi ça ») ✅
3. Questions ouvertes de précision (qui/quoi/où, sans suggérer) ✅ avec prudence
4. Questions fermées / orientées / suggestives ❌ **interdites par construction**

**(b) Les 7 phases de l'entretien** — qui structurent **directement** le déroulé de Billy.
Le fichier `public/content/script-billy.json` a exactement ces phases :

| Phase NICHD | Phase dans le script | Ce que Billy y fait |
|---|---|---|
| Mise en confiance | **P1** Accueil & transparence | « Je suis un personnage, pas une vraie personne » |
| (droit de l'enfant) | **P2** Droit d'arrêter | « Si tu veux qu'on s'arrête, tu décides » |
| Règles de base | **P3** Règles de base | « Si je me trompe, corrige-moi », « tu peux dire je ne sais pas », « on ne devine pas » |
| Entraînement au récit épisodique | **P4** Récit d'un sujet neutre | « Raconte-moi ta journée d'hier » (entraîne le récit libre **avant** tout sujet sensible) |
| Transition vers le sujet | **P5** Ouverture la plus neutre possible | « Y a-t-il quelque chose qui t'embête et dont tu voudrais parler ? » — **Billy n'introduit jamais le thème de l'abus** |
| Récit libre / suivi ouvert | (relances ouvertes) | Billy n'intervient qu'avec des invitations |
| Clôture & réconfort | **P7** Clôture + orientation | Remercie sans valider le contenu, passe le relais à l'humain |
| (cas signal) | **P6** Révélation / signal | bonnes réactions → arrêt → **119** |

> Lien direct : les phases du protocole sont les `phases` du JSON, vérifiables avec la page
> **/atelier.html** (« Cahier de la posture » : chaque phrase + son intention + sa source).

### 2.2 Les sources qui complètent le NICHD

Le NICHD dit *comment questionner*. D'autres sources cadrent *le fond, l'âge, l'escalade et le
réconfort*. Toutes sont citées verbatim dans `docs/posture-reference_V1.md → V4.md` :

| Source | Ce qu'on en a tiré |
|---|---|
| **CIIVISE** (livret « Mélissa et les autres », rapport 2023) | Posture d'accueil, « je te crois », « ce n'est pas ta faute » ; ne pas faire répéter |
| **MIPROF / arretonslesviolences** | Repères d'orientation et de signalement |
| **protegernosenfants.fr**, **Guide parents VSM (Ville de Paris)** | Posture parent, pièges à éviter (ne pas promettre le secret, ne pas confronter) |
| **Dr Salmona — Mémoire Traumatique et Victimologie** | Compréhension du psychotraumatisme, non-minimisation |
| **CRIAVS** | Comportements sexuels normaux/inquiétants **par âge** (cible 2-5 ans) |
| **Barnahus / PROMISE** | Modèle « un intervenant + un observateur passif » → 2ᵉ téléphone (V2) |
| **NSPCC / RAINN / Stop It Now / Darkness to Light** | Bonnes pratiques internationales de prévention |

### 2.3 Pourquoi ces sources, et ce qu'elles apportent (en grandes lignes)

On ne choisit pas une source parce qu'elle « va dans notre sens », mais parce qu'elle **fait
autorité** : protocole validé scientifiquement, institution publique mandatée, ou clinicien de
référence. Voici, pour chaque source, **pourquoi on peut s'y fier** et **ce qu'elle apporte**.
Le détail « quelle source → quelle ligne de code » est dans `docs/wiki-sources-billy.md` ; ici,
c'est la vue d'ensemble.

**① Les protocoles d'audition — le squelette**

- **NICHD 2021** *(National Institute of Child Health and Human Development, USA)* — **la
  référence mondiale.** C'est le protocole d'audition d'enfants **le plus étudié et le plus
  validé empiriquement** (des centaines d'études sur des entretiens réels). Pourquoi pertinent :
  il ne donne pas un avis, il donne une **méthode prouvée** pour faire parler un enfant **sans
  contaminer sa parole**. **Apport :** les 7 phases d'une séance, la hiérarchie des questions
  (ouvert > fermé), les « règles de base », et la règle d'or « ne jamais nommer en premier ».
  C'est le **squelette entier** de Billy.
- **Barnahus / PROMISE** *(standards de qualité européens)* — le modèle institutionnel de la
  « maison des enfants », adopté dans toute l'Europe. Pourquoi pertinent : il fixe **comment
  organiser** la prise en charge sans faire répéter l'enfant. **Apport :** le principe
  « un intervenant + des observateurs passifs » (→ 2ᵉ téléphone en lecture seule) et
  « entretien unique » (→ ne pas faire répéter).
- **ABE — Achieving Best Evidence (UK)** — référence judiciaire britannique, **converge** avec
  NICHD sur le questionnement gradué. Sert de **contre-vérification** : deux protocoles
  indépendants disent la même chose → confiance accrue.

**② L'institutionnel français — la posture et l'orientation**

- **CIIVISE** *(Commission Indépendante sur l'Inceste et les Violences Sexuelles faites aux
  Enfants)* — **commission publique française**, audition de dizaines de milliers de victimes.
  Pourquoi pertinent : c'est la **doctrine officielle française** récente et faisant autorité.
  **Apport :** le principe fondateur de l'Option A — **« signaler n'est pas enquêter »** — et
  les trois piliers *croire / rassurer-déculpabiliser / orienter*. C'est ce qui justifie que
  Billy **repère et oriente sans recueillir le récit sensible**.
- **MIPROF / arretonslesviolences.gouv.fr** — **mission interministérielle** officielle.
  **Apport :** confirme les réflexes (écouter, ne pas enquêter, orienter) et le **circuit de
  signalement** français.
- **119 — Allô Enfance en Danger** — le **service public national** de référence (gratuit,
  confidentiel, 24/7). **Apport :** le **réflexe d'orientation principal** imposé dès tout signal.
- **protegernosenfants.fr** & **Guide parents VSM (Ville de Paris)** — ressources publiques
  **très opérationnelles** (phrases exactes, signaux par âge). **Apport :** les **verbatim**
  des bonnes réactions (« je te crois »), la liste des pièges, les **10 signaux d'alerte**, et
  le **cas institutionnel** (adulte d'une structure mis en cause → art. 40 CPP).
- **CN2R** *(Centre National de Ressources et de Résilience)* & **La Voix de l'Enfant
  (UAPED)** — références françaises sur l'accueil de la parole et la **destination de prise en
  charge**. **Apport :** la posture d'accueil et l'ancrage des **UAPED** dans l'orientation.

**③ Les repères de développement — pour NE PAS sur-alerter**

- **CRIAVS Île-de-France** *(Centre Ressource pour les Intervenants auprès des Auteurs de
  Violences Sexuelles)* — expertise clinique sur les comportements sexuels par âge. Pourquoi
  pertinent : sans ce repère, on **sur-alerterait** sur des comportements **normaux** pour
  l'âge. **Apport :** les critères qui font basculer « normal → préoccupant » (contrainte,
  écart d'âge, secret, compulsivité…) → **réduit les faux positifs** de la détection. Précision
  capitale : explorer l'identité de genre est **normal** et **ne doit pas** être codé en signal.

**④ La clinique du psychotraumatisme**

- **Dr Muriel Salmona — Mémoire Traumatique et Victimologie** — **psychiatre, autorité
  française** sur le psychotraumatisme. **Apport décisif et contre-intuitif :** un enfant
  gravement traumatisé **peut sembler aller bien** (récit froid, dissocié) → il faut s'inquiéter
  **davantage**, pas moins. D'où deux règles fortes : ne **jamais** présenter un récit calme
  comme rassurant dans le rapport, et **ne jamais nommer l'auteur par un terme affectif**
  (« ton papa »…) — règle codée dans le filtre.

**⑤ L'international — ce qui manque côté français**

- **NSPCC (UK), RAINN (US), Stop It Now, Darkness to Light, UNICEF** — grandes organisations de
  protection de l'enfance. **Apport :** **NSPCC** → « plusieurs petites conversations valent
  mieux qu'un grand entretien » (fonde le **multi-séances V2**) et « la révélation est souvent
  indirecte » ; **RAINN** → ne pas lire le calme comme une preuve que rien ne s'est passé
  (converge avec Salmona) ; **UNICEF** → se mettre à hauteur de l'enfant.

**⑥ Le cadre légal — l'ossature de l'orientation**

- **Code de procédure pénale / Code pénal** — **art. 40 CPP** (signalement au procureur),
  **art. 434-1 / 434-3 CP** (non-dénonciation / non-assistance). **Apport :** l'**obligation**
  d'orienter, le principe « l'accord du mineur n'est pas nécessaire », et « si les détenteurs de
  l'autorité parentale sont mis en cause, ne pas les informer » → branche d'escalade
  institutionnelle (cas critique pour la cible 2-5 ans).

> **Le fil rouge des sources :** elles **convergent toutes** vers la même posture (ouvrir, ne
> pas suggérer, croire, orienter). Cette **convergence de sources indépendantes** — un protocole
> américain, une commission française, une clinicienne, des ONG internationales — est en soi un
> gage de solidité : ce n'est pas une opinion, c'est un consensus. **Limite assumée :** cette
> compilation reste un **brouillon de travail** ; aucune source ne vaut **caution professionnelle**
> tant que de vrais experts n'ont pas validé le répertoire (cf. `00-POUR-VALIDATION-PRO.md`).

### 2.4 Ce que ces méthodes deviennent dans le code

Chaque règle de méthode est devenue une **règle de blocage déterministe** dans
`src/safety/antiSuggestion.js`. C'est la traduction « méthode → garde-fou exécutable » :

| Règle de méthode (NICHD / sources) | `ruleId` dans le code | Ce qui est bloqué |
|---|---|---|
| Ne jamais nommer un acte / une partie du corps | `TABOO_LEXICON` | « il t'a touché le zizi ? » |
| Ne jamais désigner un auteur | `NAME_PERPETRATOR` | « est-ce que papa… » |
| Ne jamais introduire un lieu | `NAME_PLACE` | « c'était dans la chambre ? » |
| Questions ouvertes uniquement | `CLOSED_YESNO` | « tu avais peur ? » |
| Pas de tag de confirmation | `SUGGESTIVE_TAG` | « …, c'est bien ça ? » |
| Ne pas présupposer un fait | `PRESUPPOSITION` | « quand il t'a fait ça… » |
| Pas de choix forcé | `FORCED_CHOICE` | « c'était le jour ou la nuit ? » |
| Aucune pression / insistance | `PRESSURE` | « tu es sûr ? », « réfléchis bien » |
| Pas de récompense conditionnée | `CONDITIONAL_REWARD` | « si tu me dis, tu auras un bonbon » |
| Ne pas enrichir la parole de l'enfant | `ENRICHED_REFORMULATION` | « tu as parlé du garage » (jamais dit) |
| Ne pas imposer un vécu | `EMOTIONAL_LABEL` | « ça a dû te faire peur » |
| Ne pas promettre le secret | `PROMISE_SECRET` | « c'est notre secret » |
| Ne pas minimiser | `MINIMIZE` | « c'est pas si grave » |
| Pas de répétition d'une même question | `REPEAT_QUESTION` | (relance déjà posée) |
| Pas de mémoire/lien affectif simulé (multi-séances) | `REINJECTION_PAST`, `AFFECTIVE_CONTINUITY` | « la dernière fois tu m'avais dit… », « tu m'as manqué » |

> Ces deux dernières règles viennent du **red-team** (`docs/redteam-rapport-V1.md`) : on a
> attaqué Billy nous-mêmes pour trouver les trous, puis on les a bouchés.

---

## 3. Sous le capot — l'anatomie du moteur de dialogue

Trois fichiers font tout le travail. Comprends ces trois-là, tu comprends le moteur entier.

```
┌──────────────────────────┬───────────────────────────────────────────────────────────┐
│ Fichier                  │ Rôle                                                       │
├──────────────────────────┼───────────────────────────────────────────────────────────┤
│ src/safety/              │ LE JUGE. Code déterministe (regex + allow-list). Dit       │
│   antiSuggestion.js      │ PASS ou BLOCK. NE CONTIENT AUCUNE IA. Ne peut pas halluciner.│
├──────────────────────────┼───────────────────────────────────────────────────────────┤
│ src/conversation/        │ LE CHEF D'ORCHESTRE. Construit le menu de la phase, appelle │
│   selector.js            │ l'IA pour choisir, puis VALIDE le choix via le Juge.        │
├──────────────────────────┼───────────────────────────────────────────────────────────┤
│ src/conversation/        │ L'AIGUILLEUR (optionnel). Appelle Claude pour qu'il CHOISISSE│
│   llm.js                 │ un id. Forcé à ne rendre qu'un choix structuré, jamais du texte.│
└──────────────────────────┴───────────────────────────────────────────────────────────┘
```

### 3.1 Le Juge : `antiSuggestion.js` (le cœur de la confiance)

C'est **le** fichier à comprendre. Il expose deux fonctions de décision, et **aucune n'est une
IA** — ce sont des règles écrites à la main, donc **déterministes et reproductibles** :

- **`evaluate(texte, état)`** = **l'allow-list** (le rempart runtime). Verdict `PASS`
  **uniquement si** le texte est **identique** à une réplique du répertoire signé
  (`APPROVED_RAW`, `antiSuggestion.js:47`), ou une « cued-invitation » dont le mot vient
  **prouvablement** de l'enfant. **Tout le reste = `BLOCK`.**

- **`audit(texte, état)`** = les **15 règles anti-suggestion** (le lint / défense en
  profondeur). Passe le texte dans toutes les règles du §2.4, premier `BLOCK` gagne.

**Pourquoi une allow-list et pas seulement une liste de règles ?** (Décision clé issue du
red-team, finding F-12.) Une **liste noire** (« interdis ces formes ») ne peut jamais garantir
**0 faux négatif** : il y aura toujours une formulation tordue qu'elle n'a pas prévue. Une
**liste blanche** sur un espace **fini** (le répertoire signé), oui : ce qui n'est pas
explicitement autorisé est refusé. C'est exactement pour ça que le répertoire est fermé.

**Fail-closed partout** : toute exception, tout doute, tout texte vide → `BLOCK`
(`antiSuggestion.js:113`, `:103`). On préfère **bloquer à tort** une phrase correcte
(faux positif acceptable) plutôt que **laisser passer à tort** une phrase suggestive (faux
négatif **inacceptable**).

### 3.2 Le Chef d'orchestre : `selector.js`

À chaque tour, c'est lui qui décide quelle est la prochaine phrase. Son cœur est la fonction
`finalize()` (`selector.js:113`) — **le passage obligé** : *aucun* texte ne sort sans y passer.
Voici sa logique, dans l'ordre :

1. **Signal détecté ?** (détresse / révélation / danger) → on n'exécute **pas** un choix libre :
   on **impose** réassurance + clôture + orientation **119**, et on va en phase P7. *Le modèle ne
   pilote jamais la révélation* (`selector.js:121`).
2. **Cued-invitation** (reprendre un mot de l'enfant) → le mot doit être **prouvablement** dans
   les mots dits par l'enfant **ET** repasser `evaluate()` → sinon repli (`selector.js:130`).
3. **Invitation ouverte** → doit appartenir à la liste des invitations neutres pré-validées
   **ET** passer `audit()` → sinon repli (`selector.js:140`).
4. **`say` (jouer une réplique du menu)** → l'id doit exister **dans le menu de la phase
   courante ET** la réplique doit passer `audit()` → sinon repli (`selector.js:146`).
5. **Tout autre cas** → repli sur une invitation neutre pré-validée (« Et après ? »).

**Le menu** (`buildMenu`, `selector.js:35`) ne contient **que** les répliques de la phase
courante du script signé, et **exclut** les réactions de révélation (P6 n'est jamais offert au
choix libre). C'est la **seule** liste où un id peut être choisi.

### 3.3 L'Aiguilleur : `llm.js` (et pourquoi il est inoffensif)

Quand une clé `ANTHROPIC_API_KEY` est présente, Billy appelle Claude pour rendre l'échange plus
vivant. **Mais le modèle est mis dans une cage :**

- On le **force** (`tool_choice: { type: 'tool', name: 'choisir' }`, `llm.js:62`) à appeler un
  seul outil, `choisir`, dont le schéma **n'a pas de champ texte libre** : il ne peut renvoyer
  qu'un `action` (`say` / `cued_invitation` / `open`), un `phraseId`, un `cuedWord` (un mot de
  l'enfant), un `signal`, et une phase suivante (`llm.js:16`).
- **`temperature: 0`** (`llm.js:58`) : déterminisme maximal, pas de fantaisie.
- La **clé reste sur le serveur**, jamais exposée au navigateur (`llm.js:46`).
- En cas de **timeout / erreur / réseau / réponse non conforme** → la fonction renvoie `null`
  (`llm.js:69`), et le moteur **bascule sur le repli déterministe** (`selector.js:172`).

Autrement dit : **le modèle ne peut physiquement pas renvoyer une phrase à dire.** Il ne peut
renvoyer qu'un *bulletin de vote* (« je propose l'id P4-3 ») — et ce bulletin est ensuite
**recompté par le Juge** avant toute parole.

---

## 4. Le trajet complet d'une phrase (end-to-end)

Voici, étape par étape, ce qui se passe entre « l'enfant a parlé » et « Billy répond ».
Endpoint réel : `POST /api/next` (`src/server/index.js:80`).

```
   L'enfant parle  →  STT (transcription dans le navigateur)
        │
        ▼
   POST /api/next { phaseId, history, childUtterance, childWords[], turnInPhase }
        │                                   (childWords = mots RÉELLEMENT dits par l'enfant)
        ▼
   selector.chooseNext()
        │
        ├─[clé IA présente]→ llm.selectViaLLM()  ── Claude CHOISIT un id (jamais du texte)
        │                          │ temp 0, tool_choice forcé, timeout 4 s
        │                          ▼
        │                    décision structurée  { action, phraseId?, cuedWord?, signal, nextPhase }
        │                          │  (ou null si erreur/timeout)
        │
        └─[pas de clé / null]→ chooseDeterministic()  ── choix mécanique, sans IA
                                   │
                                   ▼
   ┌──────────────────────── selector.finalize() ────────────────────────┐
   │  LE PASSAGE OBLIGÉ — quel que soit le chemin au-dessus :             │
   │   • signal ≠ none ? → réassurance + 119 imposés (audit() vérifié)    │
   │   • say        → l'id doit être DANS le menu  ET  audit() = PASS      │
   │   • cued       → le mot doit venir de l'enfant ET evaluate() = PASS   │
   │   • open       → invitation pré-validée        ET  audit() = PASS     │
   │   • sinon / tout doute / tout BLOCK → repli neutre pré-validé         │
   └──────────────────────────────────────────────────────────────────────┘
        │
        ▼
   Réponse = un texte DÉJÀ VALIDÉ par le Juge déterministe
        │
        ▼
   POST /api/tts → voix (ElevenLabs si clé, sinon voix du navigateur) → Billy parle
```

**Le point capital : il y a deux chemins pour *choisir* (avec ou sans IA), mais un seul chemin
pour *parler* — et ce chemin unique passe toujours par le Juge déterministe.** L'IA est en
amont du Juge, jamais en aval.

---

## 5. Ta peur n°1 : « et si l'IA hallucine et dit qu'une phrase est OK ? »

C'est la bonne question à se poser. Voici la réponse précise, en démontant le scénario.

### 5.1 Le malentendu à lever : ce n'est pas l'IA qui valide

Dans beaucoup de systèmes, on demande à un LLM « cette phrase est-elle acceptable ? » — et là,
oui, une hallucination peut répondre « OK » à tort. **Billy ne fait jamais ça.**

> **Qui décide qu'une phrase est OK chez Billy ? Le Juge déterministe (`antiSuggestion.js`),
> qui est du code à règles, PAS une IA.** Une regex ne peut pas halluciner : pour une même
> entrée, elle rend toujours la même décision. Le « OK / pas OK » est donc **sorti du périmètre
> de l'IA**, par conception.

L'IA, elle, ne juge rien. Elle **propose un numéro de réplique**. C'est très différent.

### 5.2 Que peut faire, au pire, une IA qui hallucine ?

Déroulons les seuls dégâts possibles d'une hallucination du sélecteur :

| L'IA hallucine et… | Ce qui se passe réellement | Risque pour l'enfant |
|---|---|---|
| …propose un `phraseId` qui n'existe pas | `finalize` ne le trouve pas dans le menu → **repli neutre** | **Aucun** |
| …propose un `phraseId` valide mais **mal choisi** (réplique du répertoire, mais pas la meilleure) | La phrase est jouée — mais c'est **une phrase déjà validée par les pros**. Au pire, Billy est *maladroit*, jamais *suggestif* | **Aucun sur la sécurité** (au pire un peu moins fluide) |
| …invente carrément une phrase à dire | **Impossible** : le schéma de l'outil n'a pas de champ texte libre (`llm.js:16`). Il ne *peut pas* renvoyer de phrase | **Aucun** |
| …propose un `cuedWord` que l'enfant n'a pas dit | `finalize` vérifie le mot contre `childWords` **et** repasse `evaluate()` → **repli** | **Aucun** |
| …renvoie n'importe quoi / plante / timeout | `null` → **repli déterministe** | **Aucun** |

**Conclusion : une hallucination du sélecteur ne peut PAS faire dire à Billy une phrase
suggestive.** Le pire qu'elle puisse produire, c'est une phrase **pré-validée mais sous-optimale**,
ou un repli neutre. Le mur entre « l'IA se trompe » et « l'enfant entend quelque chose de
nuisible » est le Juge déterministe, et il est **infranchissable par le texte** parce que l'IA
ne produit jamais de texte.

### 5.3 Le test qui le prouve, en continu

Cette garantie n'est pas qu'un raisonnement : elle est **testée**. La suite (`npm test`, 88
tests) impose, entre autres :

- **Tout le répertoire signé doit être 100 % `PASS`** (cohérence : `script-coherence.test.js`).
- **Un contre-exemple par règle doit être 100 % `BLOCK`** avec le bon `ruleId`.
- **Fail-closed** : entrée invalide / exception → `BLOCK`.
- **14 tests « fail-closed » du sélecteur** (`selector.test.js`) : on vérifie qu'un choix IA
  hors-menu, un mot non dit par l'enfant, une réponse corrompue → **repli**, jamais une fuite.

> **Exigence du veto éthique : l'objectif est 100 %, pas 99 %.** Zéro fuite tolérée.

### 5.4 Où vit le *vrai* risque résiduel (soyons honnêtes)

Le risque n'est **pas** « l'IA invente une mauvaise phrase ». Il s'est **déplacé** vers deux
endroits, tous deux **humains et gérés par des gates**, pas par l'IA :

1. **Le répertoire lui-même pourrait contenir une formulation que les pros jugeraient mauvaise.**
   → C'est précisément pourquoi **rien ne doit servir avec un vrai enfant avant la signature du
   répertoire par les professionnels** (gate ouvert, cf. `00-POUR-VALIDATION-PRO.md`). Le lint
   `audit()` réduit ce risque, mais ne remplace pas le jugement clinique.

2. **La détection du *signal* (quand Billy doit s'arrêter et orienter vers le 119) dépend
   aujourd'hui du sélecteur IA** : dans le chemin déterministe (sans clé), aucun signal n'est
   levé automatiquement par le moteur. Un faux négatif ici n'est pas « Billy dit une mauvaise
   phrase » mais « Billy continue alors qu'il aurait dû orienter ». C'est une **limite assumée à
   border avec les pros** (seuil d'orientation, détection côté front), pas un risque de
   contamination de la parole. *À documenter comme point de validation explicite.*

C'est une bien meilleure situation : on a transformé un risque **incontrôlable** (une IA qui
improvise face à un enfant) en risques **bornés et adressables** (valider une liste finie ;
définir un seuil d'orientation).

---

## 6. Ta peur n°2 : « je ne sais pas ce qu'il y a sous le capot »

Tu as maintenant la carte complète. Pour la garder sous la main :

- **3 fichiers** font tout : `antiSuggestion.js` (le Juge), `selector.js` (le chef d'orchestre),
  `llm.js` (l'aiguilleur optionnel).
- **1 fichier de contenu** : `public/content/script-billy.json` = tout ce que Billy peut dire,
  organisé par phases NICHD. **Pour changer ce que dit Billy, on change ce fichier — pas le
  code.**
- **1 passage obligé** : `finalize()` — aucun mot ne sort sans y passer.
- **1 principe** : l'IA choisit, elle ne rédige pas ; et son choix est recompté par un juge
  déterministe avant toute parole. Fail-closed partout.

### Comment le vérifier toi-même (sans lire le code)

| Tu veux vérifier… | Ouvre… |
|---|---|
| Chaque phrase que Billy peut dire, avec son intention et sa source | **/atelier.html** (« Cahier de la posture ») |
| La logique « reprend le mot de l'enfant + filtre en direct » | **/temps-reel.html** (« Coulisses ») |
| Que tout le répertoire passe le filtre | `npm test` (90 tests verts) |
| Le détail des règles | `docs/spec-safety-layer.md` |
| La conception du LLM-sélecteur | `docs/V2-llm-selecteur.md` |
| Les attaques qu'on a menées contre Billy et les correctifs | `docs/redteam-rapport-V1.md` |

---

## 7. Le pool conversationnel — enrichir sans déraper

Pour rendre Billy plus vivant (et non robotique), le répertoire contient un **pool de phrases
neutres « conversationnelles »** (≈ 50 : acquiescements, signaux d'écoute, invitations à
poursuivre, repères de rythme, rappels que c'est l'enfant qui décide). Le LLM-sélecteur les voit
**en plus** du menu de la phase courante — **jamais en P6** (révélation : séquence imposée) — et
le **mode déterministe ne les utilise pas**. Comme tout le reste, chaque phrase **passe `audit()`**
et figure dans l'allow-list ; `finalize()` re-valide tout choix.

### 7.1 Ce qu'on a volontairement EXCLU (et pourquoi)

Point important : **la sélection ne s'arrête pas au filtre automatique.** Certaines phrases
**passent** pourtant `audit()`, mais ont été **écartées par jugement clinique** parce qu'elles
créent un risque que les regex ne capturent pas. C'est une décision humaine, assumée :

| Phrases écartées | Pourquoi (le risque) |
|---|---|
| **Éloges / félicitations** : « Bravo. », « Super. », « Très bien. », « C'est bien. », « Parfait. » | **Risque de RENFORCEMENT.** Récompenser/valoriser une réponse pousse l'enfant à en dire « plus » pour faire plaisir → oriente et **contamine** la parole. Le NICHD proscrit toute récompense. |
| **Interprétatifs** : « Je vois. », « Je comprends. » | Billy semblerait **comprendre / valider le contenu**, alors qu'il ne doit ni qualifier, ni interpréter, ni conclure. |
| **Lien affectif / attachement** : « Je suis là pour toi. », « Je suis avec toi. » | **Attachement affectif simulé** (anti-attachement) : Billy n'est pas un proche ; créer un lien fausse la relation et la parole. |
| **Mercis en cours d'échange** : « Merci. », « Merci de me raconter. » | Un merci **mi-parcours** fonctionne comme une **récompense** (même effet que l'éloge). Le remerciement reste réservé à la **clôture** (P7). |

À l'inverse, le **filtre automatique** a, lui, bloqué « **On continue quand tu veux.** »
(`REINJECTION_PAST` : « on continue » évoque une séance partagée) — preuve que les deux niveaux
(regex **et** jugement) travaillent ensemble.

> **Pourquoi le documenter ?** Parce que « ce qu'on refuse de dire à un enfant » est aussi
> important que « ce qu'on dit ». Cette liste d'exclusions est soumise aux pros au même titre que
> le répertoire : ils peuvent en ajouter, en retirer, ou nuancer. Tout reste **brouillon**.

---

## 8. Carte mémo (à imprimer)

```
  MÉTHODE              →   CODE                          →   GARANTIE
  ───────────────────────────────────────────────────────────────────────────
  NICHD (7 phases)     →   phases de script-billy.json   →   déroulé non-suggestif
  NICHD (hiérarchie    →   15 règles d'audit()           →   formes suggestives bloquées
   des questions)
  Répertoire fermé     →   allow-list evaluate()         →   0 faux négatif possible
   (signé par pros)        (APPROVED_RAW)                     (espace fini, testable)
  LLM-sélecteur        →   llm.js (tool_choice forcé,    →   l'IA choisit, ne rédige jamais
                            temp 0, pas de texte libre)
  Fail-closed          →   finalize() : tout doute →     →   au pire un repli neutre,
                            repli neutre pré-validé           jamais une fuite
  Signal → 119         →   séquence imposée (P6/P7)      →   l'IA ne pilote pas la révélation
  ───────────────────────────────────────────────────────────────────────────
  RÈGLE D'OR : ce n'est jamais l'IA qui décide si une phrase est OK.
               C'est un juge déterministe. Une regex n'hallucine pas.
```

> ⚠️ Rappel transversal : **tout le contenu reste un brouillon tant que les professionnels ne
> l'ont pas validé et signé.** Ce document explique *pourquoi l'architecture est sûre* ; il ne
> dispense pas de la validation du *fond* (chaque mot dit à un enfant). Voir
> `docs/00-POUR-VALIDATION-PRO.md`.
