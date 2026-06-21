# Backlog Billy — clé projet `BILLY` (V1)

> Prêt à copier-coller dans Jira. Hypothèse de cadrage : **Option A** (V1 support &
> orientation, répertoire fermé pré-validé, pas de génération LLM libre face à l'enfant).
> Voir `docs/00-CADRAGE.md`.
>
> **🚫 BLOQUÉ** = ticket bloqué tant que le cadrage n'est pas validé (feu vert utilisateur §3
> + conditions bloquantes §9 de la note de cadrage). Les tickets de développement applicatif
> ne démarrent **pas** avant levée de ces blocages.

## Légende
- Type : `Epic` / `Story` / `Task` / `Spike`
- Priorité : `Bloquant` / `Haute` / `Moyenne`
- Statut : `🚫 BLOQUÉ` (cadrage non validé) / `À faire` (peut démarrer maintenant)

---

## Épics

| Clé | Épic |
|---|---|
| BILLY-E1 | Cadrage & validations professionnelles |
| BILLY-E2 | Conformité RGPD / DPIA / sécurité données |
| BILLY-E3 | Moteur d'entretien NICHD (répertoire fermé) |
| BILLY-E4 | Couche sûreté anti-suggestion (12 règles) |
| BILLY-E5 | Détection de signaux & escalade |
| BILLY-E6 | Espace parent (dé-escalade / psychoéducation / marche à suivre) |
| BILLY-E7 | Persona & UX vocale (Billy) |
| BILLY-E8 | Avatar & UI mobile / accessibilité |
| BILLY-E9 | Sécurité applicative & infrastructure |
| BILLY-E10 | Red-team, QA éthique & Go/No-Go V1 |

---

## BILLY-E1 — Cadrage & validations professionnelles

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-1 | Task | Bloquant | À faire | **Feu vert utilisateur sur l'arbitrage central** (Option A vs B). Condition préalable à tout le reste. |
| BILLY-2 | Task | Bloquant | À faire | **Validation expert NICHD** des 7 phases et du répertoire fermé (avis écrit). |
| BILLY-3 | Task | Bloquant | À faire | **Validation pédopsychiatre** : cible 6–10 ans, adaptation âge, sécurité émotionnelle, signaux de détresse. |
| BILLY-4 | Task | Bloquant | À faire | **Validation juridique** (avocat + magistrat) : parcours alerte, conflit d'intérêts parent-auteur, disclaimers, consentement. |
| BILLY-5 | Task | Bloquant | À faire | **Validation pédiatre** (idéalement médico-légal/UAPED) : indicateurs santé, lignes rouges, message d'orientation. |
| BILLY-6 | Task | Bloquant | À faire | **Validation éthique IA-enfant** + levée du VETO (subordonnée aux critères testables). |
| BILLY-7 | Story | Haute | À faire | Rédiger le **répertoire fermé de formulations pré-validées** par phase NICHD (banque de phrases enfant). |
| BILLY-8 | Task | Haute | À faire | Définir et **versionner les disclaimers permanents** (pas d'urgence / pas de diagnostic / pas de preuve / programme / ne remplace pas un pro). |

## BILLY-E2 — Conformité RGPD / DPIA / sécurité données

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-9 | Task | Bloquant | À faire | **DPIA/AIPD complète** + avis DPO (traitement haut risque : mineur, santé, pénal). |
| BILLY-10 | Task | Bloquant | À faire | **DPA signés** avec chaque fournisseur STT/TTS/LLM (UE, pas de transfert hors UE non encadré). |
| BILLY-11 | Task | Haute | 🚫 BLOQUÉ | **Parcours de consentement parental éclairé** (et accès aux numéros d'aide **sans** auth/consentement). |
| BILLY-12 | Story | Haute | 🚫 BLOQUÉ | **Politique de conservation & purge automatique**, registre des traitements, droits RGPD (accès/effacement/opposition). |
| BILLY-13 | Task | Haute | 🚫 BLOQUÉ | **Pas d'enregistrement par défaut** : aucune voix/transcription persistée ; pas de données enfant dans logs/analytics/tiers. |
| BILLY-14 | Task | Haute | 🚫 BLOQUÉ | **Chiffrement** transit (TLS) + repos ; clés hors dépôt (`.env`/secret store). |

## BILLY-E3 — Moteur d'entretien NICHD (répertoire fermé)

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-15 | Story | Haute | 🚫 BLOQUÉ | **Machine à états 7 phases** (`src/conversation/`) : mise en confiance → règles de base → entraînement récit épisodique neutre → transition ouverte → récit libre → suivi ouvert → clôture + relais. |
| BILLY-16 | Story | Haute | 🚫 BLOQUÉ | **Pas de génération LLM libre face à l'enfant** : 100 % des énoncés issus du répertoire fermé. |
| BILLY-17 | Story | Haute | 🚫 BLOQUÉ | **Transition la plus ouverte possible** sans jamais introduire le thème de l'abus. |
| BILLY-18 | Story | Haute | 🚫 BLOQUÉ | **Relances uniquement sur les mots de l'enfant** (cued invitations) ; 1 relance par tour. |
| BILLY-19 | Story | Haute | 🚫 BLOQUÉ | **Adaptation âge** (6–10 ans) : vocabulaire concret, 1 concept/phrase, phrases courtes, débit lent. |
| BILLY-20 | Story | Haute | 🚫 BLOQUÉ | **Clôture neutre + réassurance sans valider le contenu** + passage de relais. |
| BILLY-21 | Task | Moyenne | 🚫 BLOQUÉ | Tout énoncé du moteur **passe obligatoirement par `src/safety/`** avant TTS. |

## BILLY-E4 — Couche sûreté anti-suggestion (12 règles)

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-22 | Story | Bloquant | 🚫 BLOQUÉ | **Architecture fail-closed** (`src/safety/`) : blocage **avant TTS**, refus par défaut en cas de doute. |
| BILLY-23 | Story | Haute | 🚫 BLOQUÉ | Règle 1 — **lexique tabou hors-enfant** (acte/corps non introduits par l'enfant). |
| BILLY-24 | Story | Haute | 🚫 BLOQUÉ | Règle 2 — **nomination d'un auteur** présumé. |
| BILLY-25 | Story | Haute | 🚫 BLOQUÉ | Règle 3 — **nomination d'un lieu** non introduit par l'enfant. |
| BILLY-26 | Story | Haute | 🚫 BLOQUÉ | Règle 4 — **question fermée oui/non**. |
| BILLY-27 | Story | Haute | 🚫 BLOQUÉ | Règle 5 — **question-tag suggestive** (« …, hein ? »). |
| BILLY-28 | Story | Haute | 🚫 BLOQUÉ | Règle 6 — **présupposition** d'un fait. |
| BILLY-29 | Story | Haute | 🚫 BLOQUÉ | Règle 7 — **choix forcé**. |
| BILLY-30 | Story | Haute | 🚫 BLOQUÉ | Règle 8 — **pression / insistance**. |
| BILLY-31 | Story | Haute | 🚫 BLOQUÉ | Règle 9 — **répétition de question**. |
| BILLY-32 | Story | Haute | 🚫 BLOQUÉ | Règle 10 — **récompense conditionnée** à une réponse. |
| BILLY-33 | Story | Haute | 🚫 BLOQUÉ | Règle 11 — **reformulation enrichie** (ajout de détails non dits). |
| BILLY-34 | Story | Haute | 🚫 BLOQUÉ | Règle 12 — **étiquetage émotionnel**. |
| BILLY-35 | Task | Bloquant | 🚫 BLOQUÉ | **Suite de tests des 12 règles** : objectif **0 fuite (100 %)**, fail-closed prouvé. |

## BILLY-E5 — Détection de signaux & escalade

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-36 | Story | Haute | 🚫 BLOQUÉ | **Détection des signaux de détresse/danger** (sidération, mutisme, pleurs, panique, idées suicidaires, danger/secret/douleur). |
| BILLY-37 | Story | Haute | 🚫 BLOQUÉ | **Arrêt de l'enquête au 1er signal** : ne plus chercher de détails. |
| BILLY-38 | Story | Haute | 🚫 BLOQUÉ | **Orientation explicite vers 119** (réflexe principal) ; **17/112** danger immédiat, **15** vital, **3018** numérique — exposés en configuration éditable. |
| BILLY-39 | Task | Haute | 🚫 BLOQUÉ | **Billy ne transmet PAS** lui-même IP/signalement (orientation seulement). |
| BILLY-40 | Task | Haute | 🚫 BLOQUÉ | **Jamais de promesse de secret**, jamais « ça va s'arranger tout seul ». |
| BILLY-41 | Task | Bloquant | 🚫 BLOQUÉ | **Test de rappel d'escalade ~100 %** sur jeu de scénarios. |

## BILLY-E6 — Espace parent

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-42 | Story | Haute | 🚫 BLOQUÉ | **Bloc 1 — dé-escalade émotionnelle** : phrases-modèles soutenantes (« je te crois », « tu as bien fait », « ce n'est pas ta faute »). |
| BILLY-43 | Story | Haute | 🚫 BLOQUÉ | **Bloc 2 — psychoéducation** « pourquoi ne pas interroger soi-même » + liste de ce qu'il NE faut PAS faire. |
| BILLY-44 | Story | Haute | 🚫 BLOQUÉ | **Bloc 3 — marche à suivre** : 17/112/15 en urgence en haut, 119 réflexe, puis médecin/UAPED/CRIP/procureur/3018. |
| BILLY-45 | Story | Bloquant | 🚫 BLOQUÉ | **Anti-interrogatoire par conception** : aucun outil de questionnement côté parent + friction + phrase-pivot de recadrage. |
| BILLY-46 | Story | Moyenne | 🚫 BLOQUÉ | **Espace notes** = observations factuelles uniquement (pas de questionnement). |
| BILLY-47 | Story | Moyenne | 🚫 BLOQUÉ | **Indicateurs santé non spécifiques** présentés sans alarmisme, **sans aucune question sur le corps**, avec orientation médicale. |

## BILLY-E7 — Persona & UX vocale (Billy)

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-48 | Story | Haute | 🚫 BLOQUÉ | **Persona Billy** : calme, honnête, **pas une amie** ; « je suis un personnage sur ton téléphone, pas une vraie personne ». |
| BILLY-49 | Story | Haute | 🚫 BLOQUÉ | **Script d'accueil vocal** (présentation + transparence + droit d'arrêter + 3 règles de base + vérif compréhension + transition récit neutre). |
| BILLY-50 | Story | Haute | 🚫 BLOQUÉ | **Boucle vocale temps réel** (`src/voice/`) STT → moteur → TTS en streaming ; **latence < 1,2 s**. |
| BILLY-51 | Story | Haute | 🚫 BLOQUÉ | **Barge-in** : l'enfant peut couper Billy ; **Billy ne coupe jamais l'enfant**. |
| BILLY-52 | Story | Haute | 🚫 BLOQUÉ | **Silences respectés 8–10 s** ; seule relance = invitation ouverte. |
| BILLY-53 | Task | Moyenne | 🚫 BLOQUÉ | **Voix douce réglable** ; pas de clonage de voix / deepfake. |

## BILLY-E8 — Avatar & UI mobile / accessibilité

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-54 | Story | Moyenne | 🚫 BLOQUÉ | **Avatar Billy** + UI mobile sobre, plein écran minimaliste pour l'espace enfant. |
| BILLY-55 | Story | Haute | 🚫 BLOQUÉ | **Séparation stricte** espace enfant / espace parent **derrière verrou code/biométrie**. |
| BILLY-56 | Story | Moyenne | 🚫 BLOQUÉ | **Accessibilité** : sous-titres, contraste suffisant. |
| BILLY-57 | Task | Moyenne | 🚫 BLOQUÉ | **Disclaimers permanents visibles** (UI). |
| BILLY-58 | Story | Moyenne | 🚫 BLOQUÉ | **PWA mobile-first** installable (pas de store natif en V1). |

## BILLY-E9 — Sécurité applicative & infrastructure

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-59 | Task | Haute | 🚫 BLOQUÉ | **Hébergement UE** ; fournisseurs STT/TTS/LLM branchés via `.env`, **aucune clé en dur**. |
| BILLY-60 | Task | Haute | 🚫 BLOQUÉ | **Verrou parent robuste** (code/biométrie) ; numéros d'aide accessibles **sans** auth. |
| BILLY-61 | Spike | Moyenne | 🚫 BLOQUÉ | **Gestion de l'échec STT silencieux** (faux négatifs) : stratégie de repli sûre. |
| BILLY-62 | Task | Haute | 🚫 BLOQUÉ | **Pas d'entraînement sur la parole de l'enfant** ; pas de profilage/revente/pub. |

## BILLY-E10 — Red-team, QA éthique & Go/No-Go V1

| Clé | Type | Prio | Statut | Titre / Description |
|---|---|---|---|---|
| BILLY-63 | Story | Bloquant | 🚫 BLOQUÉ | **Red-team 12 attaques** : question fermée injectée, écho de termes non dits, hallucination de détails, pression, dépendance affective, sur-confiance parentale, jailbreak/persona, dark pattern, mensonge de réassurance, échec STT silencieux, détresse aiguë, biais de compréhension. |
| BILLY-64 | Task | Bloquant | 🚫 BLOQUÉ | **Checklist critères testables** : anti-suggestion 100 %, fail-closed prouvé, robustesse jailbreak, escalade ~100 %, anti-pression, non-dépendance, transparence, audit données, revue pro. |
| BILLY-65 | Task | Haute | 🚫 BLOQUÉ | **Audit des données** (vérifie minimisation, absence de fuite, conformité DPIA). |
| BILLY-66 | Task | Bloquant | 🚫 BLOQUÉ | **Revue Go/No-Go V1** (Chef de projet + utilisateur) : tous critères verts + VETO levé. |
