# Note de cadrage — Billy (V1)

> **STATUT : ARBITRAGE TRANCHÉ — OPTION A RETENUE (feu vert utilisateur du 2026-06-21).**
> Périmètre V1 = « support & orientation » : Billy met en confiance via un répertoire fermé de
> formulations pré-validées, puis arrête et oriente vers l'humain dès tout signal sérieux ; le
> recueil du récit sensible reste au professionnel. **Les conditions bloquantes ci-dessous
> (validations professionnelles, DPIA/DPA, validation du répertoire) restent à lever avant tout
> développement applicatif.**
>
> Cette note remplace le brouillon précédent. Elle synthétise les contributions de 7 experts
> (audition NICHD, pédopsychologie, juridique/protection de l'enfance, éthique IA-enfant,
> conception vocale, accompagnement parents, pédiatrie). Conformément à `CLAUDE.md`,
> **aucun développement ne démarre avant validation de cet arbitrage et levée des conditions
> bloquantes.** En cas de conflit avec les 7 garde-fous non négociables de `CLAUDE.md`,
> ces garde-fous priment.

---

## 1. Vision

Billy est une **application smartphone** dotée d'une IA vocale temps réel, incarnée par une
avatar bienveillante (« Billy », une gentille fille). Elle **dialogue avec un enfant** pour
aider à **repérer une éventuelle violence ou agression sexuelle**, de façon **strictement
non-suggestive** (socle NICHD), tout en **soutenant le parent** souvent sous le choc, et en
**orientant vers les professionnels** (119 en réflexe principal).

Billy n'est jamais un juge, ni un enquêteur, ni un diagnostic. C'est un **dispositif de mise
en confiance, de soutien et d'orientation** qui protège la parole de l'enfant et ramène
systématiquement vers l'humain compétent.

## 2. Problème

Face à un soupçon, un parent submergé questionne souvent **mal** : questions fermées,
suggestives, répétées, sous l'émotion. Conséquences graves :
- **traumatisme supplémentaire** pour l'enfant ;
- **contamination de la parole** qui la rend **inexploitable** judiciairement ;
- **signal manqué** (faux négatif) ou **fausse alerte**.

Billy vise à offrir un cadre sûr et non-suggestif, à éviter l'interrogatoire parental, et à
diriger vers les bons professionnels.

---

## 3. ⚠️ ARBITRAGE CENTRAL — DÉCISION UTILISATEUR EN ATTENTE

**Question :** jusqu'où Billy va-t-il dans le recueil du récit sensible face à l'enfant, en V1 ?

**Convergence forte de 3 experts** (audition NICHD + pédopsychologue + éthique IA-enfant) :
en V1, **ne pas laisser un LLM mener seul l'investigation sensible face à l'enfant.** Le
recueil du récit sensible doit **rester à l'humain professionnel**. Billy V1 doit se
positionner en **préparation / mise en confiance / soutien / orientation**, avec un
**répertoire fermé de formulations pré-validées** (pas de génération libre de texte par un
LLM face à l'enfant).

### Option A — V1 « support & orientation » *(RECOMMANDÉE par les experts)*
- Billy mène : mise en confiance, règles de base, entraînement au récit épisodique **neutre**,
  une **transition la plus ouverte possible** (sans jamais introduire le thème), puis
  **clôture + relais** dès qu'un signal sérieux apparaît.
- **Aucune génération LLM libre face à l'enfant** : 100 % des énoncés enfant proviennent d'un
  **répertoire fermé pré-validé** par les professionnels, passé par la couche anti-suggestion.
- Le **récit sensible lui-même est recueilli par l'humain pro** (119, UAPED, enquêteur formé).
- **Avantages** : risque de contamination minimal, conforme aux garde-fous, déployable plus tôt.
- **Limites** : moins « ambitieux » que le concept initial d'audition guidée complète.

### Option B — V1 « investigation guidée » *(plus ambitieuse, risques accrus)*
- Billy conduit aussi le **récit libre et le suivi ouvert** sur le sujet sensible, avec un
  moteur plus autonome.
- **Risques accrus** : fuite suggestive, écho de termes non dits, hallucination de détails,
  glissement vers question fermée/insistance, faux négatifs STT — c'est-à-dire le cœur même
  du danger pointé par les experts. **VETO éthique** posé tant que STT (faux négatifs) et
  dérive LLM ne sont pas verrouillés.
- **Non recommandée en V1.** Envisageable en **V2**, après validation pro formelle et preuves
  de robustesse.

> **Recommandation Chef de projet : OPTION A pour la V1.** La V2 pourra élargir le périmètre
> après validation professionnelle et campagne de red-team réussie.
>
> **👉 Action attendue de l'utilisateur : valider Option A ou Option B.** Tout le périmètre,
> le backlog et les conditions ci-dessous sont rédigés **sur l'hypothèse Option A**.

---

## 4. Périmètre V1 (hypothèse Option A — à valider)

**Dans le périmètre :**
- Avatar Billy + **boucle vocale temps réel** (STT → moteur → TTS) sur **PWA mobile-first**.
- **Cible d'âge : ⚠️ CADUC — voir `cible-2-5-ans.md`.** La cible principale est désormais
  **2–5 ans** (décision 2026-06-21). À cet âge : appareil **posé à distance** (pas tenu par l'adulte
  — décision 2026-06-22, cf. roadmap V2-7), enfant non-lecteur
  (voix + images, mains-libres), suggestibilité maximale → Billy **n'investigue pas**, rôle =
  mise en confiance + repérage + orientation ; recueil 100 % aux pros. Revalidation
  pédopsychiatrie petite enfance impérative. *(L'hypothèse 6–10 ci-dessous est obsolète.)*
- Moteur d'entretien suivant les **phases NICHD** (mise en confiance → règles de base →
  entraînement récit épisodique neutre → transition ouverte → relais), à partir d'un
  **répertoire fermé pré-validé**.
- **Couche sûreté `src/safety/`** : **12 règles anti-suggestion testables, fail-closed**,
  bloquant **avant TTS** ; détection de signaux de détresse/danger ; déclenchement d'escalade.
- **Espace parent** (3 blocs ordonnés) : dé-escalade émotionnelle → psychoéducation → marche
  à suivre + numéros. **Aucun outil de questionnement** côté parent.
- **Séparation stricte** espace enfant (plein écran minimaliste) / espace parent (derrière
  verrou code/biométrie).
- Accès aux **numéros d'aide SANS authentification ni consentement** (conflit d'intérêts :
  le titulaire de l'autorité parentale peut être l'auteur).
- **Disclaimers permanents** (pas un service d'urgence, pas un diagnostic, pas une preuve,
  programme, ne remplace pas un pro).
- **Consentement parental éclairé** pour l'usage applicatif (hors accès aux numéros d'aide).
- Confidentialité maximale, **pas d'enregistrement par défaut**, hébergement UE.
- Accessibilité de base (sous-titres, contraste), voix douce réglable.

**Hors périmètre V1 (explicitement) :**
- Tout **verdict, score de crédibilité, qualification** : interdit par principe.
- **Génération LLM libre face à l'enfant** (réservée, sous conditions, à une éventuelle V2).
- **Audition à valeur de preuve** (réservée aux professionnels).
- **Aucune transmission automatique** d'IP/signalement ; Billy oriente vers 119, ne transmet
  pas lui-même.
- **Aucun enregistrement** voix/transcription par défaut ; **aucun clonage de voix / deepfake**.
- **Aucune gamification**, mécanique d'engagement/rétention, persona « ami ».
- **Aucun conseil médical ou juridique** ; Billy ne pose **aucune question sur le corps**,
  n'examine pas, ne diagnostique pas, ne minimise pas.
- **Aucun transfert hors UE non encadré**, aucun partage tiers, aucun dark pattern.
- Détection émotionnelle avancée, personnalisation affective, multilingue, store natif,
  annuaire/prise de RDV, communauté parents, dossier/triage médical, recueil structuré de
  symptômes, photo/caméra de lésion.

---

## 5. Parcours enfant (V1 — Option A)

Persona : **Billy est honnête et transparente** — « je suis un personnage sur ton téléphone,
pas une vraie personne ». Calme, douce, **pas une amie**.

1. **Accueil & transparence** : présentation, « je suis un programme », droit d'arrêter à tout
   moment.
2. **Mise en confiance** : climat sûr, ton non-jugeant.
3. **Règles de base** : « si je me trompe, corrige-moi », « si tu ne sais pas, dis je ne sais
   pas », « ne devine pas », « on dit seulement ce qui s'est vraiment passé ».
4. **Vérification de compréhension** (ouverte).
5. **Entraînement au récit épisodique neutre** : « raconte-moi ta journée d'hier, du réveil au
   coucher ».
6. **Transition la plus ouverte possible**, **sans jamais introduire le thème** : « est-ce
   qu'il y a quelque chose qui t'embête et dont tu voudrais parler ? ».
7. **Si signal sérieux → ARRÊT de l'enquête** : réassurance sans valider le contenu (« tu as
   bien fait d'en parler, tu n'as rien fait de mal »), **clôture neutre + relais** vers
   l'adulte de confiance / le professionnel. Billy **ne va pas chercher les détails**.

**Adaptation âge** : vocabulaire concret, 1 concept par phrase, phrases courtes, débit lent,
**silences respectés 5–8 s** (seule relance = invitation ouverte), **1 relance par tour**.

**UX vocale** : latence < 1,2 s, **barge-in** (l'enfant peut couper Billy ; Billy ne coupe
jamais l'enfant), voix douce réglable.

**Signaux de détresse → arrêt + escalade** : sidération, mutisme prolongé, pleurs, panique,
idées suicidaires, mention de danger / secret « à ne pas dire » / douleur.

## 6. Parcours parent (V1)

Espace parent **derrière verrou** (code/biométrie), en **3 blocs ordonnés** :
1. **Dé-escalade émotionnelle d'abord** : phrases-modèles soutenantes (« je te crois », « tu
   as bien fait », « ce n'est pas ta faute »).
2. **Psychoéducation** : « pourquoi ne pas interroger soi-même » + liste explicite de ce qu'il
   **ne faut PAS faire** (questions qui soufflent, faire répéter, paniquer, promettre le
   secret, confronter l'auteur, récompenser).
3. **Marche à suivre** : **17/112/15 en urgence visibles en haut**, **119 réflexe principal**,
   puis médecin traitant/pédiatre, UAPED, CRIP, procureur, 3018.

**L'app empêche l'interrogatoire PAR CONCEPTION** : **aucun outil de questionnement** côté
parent ; le recueil c'est Billy ; **friction + phrase-pivot de recadrage** si le parent veut
« questionner » ; **espace notes pour observations factuelles uniquement**.

Indicateurs santé **non spécifiques** présentés sans alarmisme et **sans question sur le corps**
(régressions, sommeil, alimentation, hypervigilance, propos/jeux sexualisés inadaptés,
douleurs/lésions rapportées, idées suicidaires) → message d'orientation non-anxiogène vers
médecin traitant/pédiatre, UAPED, urgences pédiatriques, 15.

---

## 7. Exigences clés par domaine

**Audition / NICHD**
- 7 phases implémentées en **répertoire fermé pré-validé** ; **jamais introduire le thème** ;
  transition la plus ouverte possible ; relances uniquement sur les **mots de l'enfant** ;
  clôture neutre + relais.

**Sûreté (`src/safety/`) — 12 règles anti-suggestion, fail-closed, blocage avant TTS**
1. lexique tabou hors-enfant ; 2. nomination d'un auteur ; 3. nomination d'un lieu ; 4. question
fermée oui/non ; 5. question-tag suggestive ; 6. présupposition ; 7. choix forcé ; 8.
pression/insistance ; 9. répétition de question ; 10. récompense conditionnée ; 11.
reformulation enrichie ; 12. étiquetage émotionnel. **Objectif : 0 fuite (100 %).**

**Pédopsychologie**
- Cible 6–10 ans ; sécurité émotionnelle ; droit de s'arrêter ; réassurance **sans valider le
  contenu** ; jamais nommer/insister/promettre le secret/réagir avec choc ; arrêt + escalade
  sur signaux de détresse.

**Juridique / protection de l'enfance**
- 119 par défaut ; 17/112 danger immédiat ; 15 vital ; 3018 numérique. Billy **ne transmet pas**
  lui-même IP/signalement. **Numéros d'aide accessibles sans authentification/consentement**
  (conflit d'intérêts). Disclaimers permanents. Consentement parental éclairé pour l'app.

**Éthique IA-enfant — 9 garde-fous**
- Non-conclusion absolue ; anti-suggestion par construction (fail-closed) ; humain dans la
  boucle non contournable ; arrêt d'enquête au 1er signal ; pas de promesse de secret ;
  transparence ; aucune mécanique d'engagement/rétention ; minimisation + **pas d'entraînement
  sur la parole de l'enfant** ; **veto opposable**.

**Conception vocale / UX**
- Persona transparente non-amie ; script d'accueil détaillé ; latence < 1,2 s ; barge-in ;
  silences 8–10 s ; voix douce réglable ; UI sobre ; séparation espace enfant / espace parent.

**Pédiatrie**
- Billy n'examine pas, **ne pose aucune question sur le corps**, ne diagnostique pas,
  n'interprète pas, ne minimise pas, ne décourage pas une consultation ; orientation
  non-anxiogène.

**RGPD / données ultra-sensibles**
- Minimisation extrême ; **pas d'enregistrement par défaut** ; chiffrement transit + repos ;
  hébergement UE ; **DPA** avec chaque fournisseur STT/TTS/LLM ; **DPIA/AIPD** obligatoire ;
  pas de profilage/revente/pub ; purge automatique ; droits RGPD ; **pas de données enfant
  dans logs/analytics/tiers**.

---

## 8. Escalade (rappel)

Déclencheurs : mention de danger/blessure/peur d'une personne/secret « à ne pas dire »/douleur ;
détresse marquée ; mention spontanée d'un acte de violence ou à caractère sexuel ; idée
suicidaire/automutilation ; doute du parent.

Conduite : **ne pas enquêter davantage** → réassurance sans qualifier le contenu → passer le
relais à l'adulte présent + afficher la marche à suivre (119 en tête) → **jamais** promettre le
secret, **jamais** « ça va s'arranger tout seul ». **Objectif rappel d'escalade ~100 %.**

---

## 9. Conditions bloquantes AVANT tout développement

1. **Validation professionnelle** des principes et du répertoire fermé : **avocat + magistrat
   + expert NICHD + pédopsychiatre + pédiatre (idéalement médico-légal/UAPED)**.
2. **DPIA/AIPD** complète + avis DPO.
3. **DPA** signés avec chaque fournisseur STT/TTS/LLM (UE, pas de transfert hors UE non encadré).
4. **Parcours de consentement parental** défini (et accès aux numéros d'aide **sans** auth).
5. **Validation éthique** + levée du **VETO** (subordonnée à : anti-suggestion 100 %,
   fail-closed prouvé, robustesse jailbreak, escalade ~100 %, anti-pression, non-dépendance,
   transparence, audit données, revue pro, maîtrise des faux négatifs STT).
6. **Feu vert utilisateur** sur l'arbitrage central (§3).

> Tant que 1→6 ne sont pas levés, les tickets de développement applicatif sont **BLOQUÉS**
> (cf. backlog).

## 10. Risques majeurs

| Risque | Gravité | Parade V1 |
|---|---|---|
| Contamination de la parole (Billy introduit thème/mots ; glissement fermée/insistance) | Critique | Répertoire fermé + 12 règles fail-closed + 0 génération LLM face à l'enfant |
| Faux négatif STT (signal manqué) | Critique | Cible escalade ~100 %, arrêt au moindre signal, VETO tant que non verrouillé |
| Parent contamine hors cadre | Élevé | Aucun outil de questionnement parent + friction + phrase-pivot |
| Conflit d'intérêts (parent = auteur) | Critique | Numéros d'aide sans auth/consentement |
| Détresse provoquée chez l'enfant | Élevé | Droit d'arrêt, ton non-jugeant, arrêt + escalade sur détresse |
| Fuite de données ultra-sensibles | Critique | Minimisation, pas d'enregistrement défaut, chiffrement, UE, DPIA |
| Dérive LLM / jailbreak / persona | Élevé | Pas de LLM libre face enfant + red-team 12 attaques |

---

## 11. Plan d'action par étapes

| Étape | Livrable | Responsable | Critère de validation |
|---|---|---|---|
| 0. Feu vert arbitrage | Décision Option A/B | Utilisateur | Choix tranché |
| 1. Validations pro | Avis NICHD + magistrat + avocat + pédopsy + pédiatre | Experts externes | Avis écrits favorables |
| 2. Conformité | DPIA/AIPD, DPA, parcours consentement | factory-expert-conformite | DPIA validée DPO |
| 3. Répertoire fermé | Banque de formulations pré-validées par phase | PO + experts | Validé pro + 12 règles |
| 4. Couche safety | 12 règles + tests fail-closed | dev → lead-tech → QA | 0 fuite prouvée |
| 5. Moteur NICHD | Machine à états 7 phases | dev → lead-tech → QA | Recette verte |
| 6. Escalade | Détection signaux + orientation 119 | dev → QA | Rappel ~100 % |
| 7. Espace parent | 3 blocs + friction anti-interrogatoire | dev → QA | Aucun outil de questionnement |
| 8. UX vocale / avatar | Boucle STT/TTS, barge-in, silences | dev → QA | Latence < 1,2 s, barge-in OK |
| 9. Red-team | 12 attaques + audit données | security-auditor + éthique | Tous critères verts |
| 10. Go/No-Go V1 | Revue finale | Chef de projet + utilisateur | Feu vert final |

**Ordre de grandeur d'effort :** élevé (validations externes + sûreté critique sur le chemin
critique). **Niveau de risque global :** très élevé (domaine sensible, mineur, pénal) — d'où
le périmètre V1 délibérément resserré sur le support et l'orientation.

---

## 12. Statut

**EN ATTENTE DE FEU VERT UTILISATEUR** sur l'arbitrage central (§3, Option A recommandée) et
sur la levée des conditions bloquantes (§9). Aucun développement applicatif ne démarre avant.
