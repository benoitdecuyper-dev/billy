# Billy V2 — Modèle multi-séances courtes : note de cadrage PO

> **Statut : CADRAGE PO — à valider avec billy-ethique-ia-enfant, billy-pedopsychologue,
> factory-expert-conformite et les professionnels NICHD avant tout développement.**
> Date de rédaction : 2026-06-21.
> Épopée associée : **BILLY-E15**.
> Ce document s'appuie sur : CLAUDE.md, docs/00-CADRAGE.md, docs/posture-reference_V4.md,
> docs/roadmap-V2.md, docs/rapport-de-seance.md, public/content/script-billy.json,
> .claude/agents/billy-ethique-ia-enfant.md, .claude/agents/billy-pedopsychologue.md.

---

## 1. Vision & valeur

### Pourquoi

La posture-reference_V4 (§C, NSPCC) formule clairement le principe :
**« plusieurs petites conversations valent mieux qu'un grand entretien »**.
Salmona (§A) insiste sur le respect du rythme de l'enfant et le fait que la révélation
est souvent « tardive, partielle, indirecte, non-linéaire ».

Un enfant ne livre pas tout en une seule fois. Il teste, il s'arrête, il revient. Forcer
un entretien long dans une logique de « complétion » va à l'encontre du rythme naturel
de la révélation et peut provoquer de la détresse. La V1 propose déjà le droit d'arrêter
à tout moment ; la V2 donne la possibilité de **reprendre ultérieurement**, de façon
volontaire et contrôlée.

### Pour qui

- **L'enfant** : il peut s'arrêter quand il le souhaite et revenir s'il le décide, sans
  avoir à tout recommencer de zéro, sans avoir à répéter ce qu'il a déjà dit.
- **Le parent / adulte de confiance** : le rapport de séance s'enrichit progressivement
  et reste cohérent même si l'échange s'est déroulé en plusieurs fois.
- **Le professionnel (119, UAPED, enquêteur)** : il reçoit un rapport consolidé, daté par
  session, qui retrace la chronologie des échanges sans les fusionner artificiellement.

### Ce que ce modèle N'est pas

- Une invitation à revenir pour « aller plus loin » : Billy ne relance pas, ne notifie pas,
  ne rappelle pas l'enfant.
- Un journal intime ou un suivi thérapeutique : Billy n'est pas un thérapeute.
- Un outil de continuité affective : Billy ne mémorise pas ce que l'enfant a ressenti,
  ne personnalise pas son ton en fonction des échanges passés.

---

## 2. Principes directeurs (issus de la posture)

Ces principes priment sur tout arbitrage fonctionnel. En cas de conflit, ils l'emportent.

**P1 — Entretien unique (Barnahus)**
Le récit sensible ne se répète pas. Une fois qu'un enfant a exprimé quelque chose de
sérieux, Billy ne lui redemande jamais d'en parler. « Faire répéter » est listé dans les
interdits absolus du script (script-billy.json, section `interdits`).

**P2 — Rythme de l'enfant (Salmona)**
L'enfant arrête quand il le décide. Il revient s'il le décide. Aucune mécanique dans le
produit ne doit créer une pression implicite à continuer ou à revenir.

**P3 — Pas de dépendance affective (éthique IA-enfant)**
Billy ne se souvient pas de ce que l'enfant lui a confié pour lui en reparler. La continuité
est fonctionnelle (où en est-on dans les phases NICHD) et non affective (ce que tu m'as dit,
comment tu te sentais).

**P4 — Non-suggestion absolue**
La continuité entre sessions ne doit jamais introduire un terme, un acte, un lieu ou une
personne que l'enfant n'a pas mentionné lors de la session en cours. L'état inter-sessions
ne s'injecte pas dans les formulations de Billy.

**P5 — Minimisation des données (RGPD)**
Chaque session supplémentaire est une donnée ultra-sensible de plus sur un mineur. On ne
conserve que ce qui est strictement nécessaire, le moins longtemps possible, sous
chiffrement, avec purge explicite.

**P6 — Transparence**
L'enfant et l'adulte savent qu'une continuité limitée existe et ce qu'elle contient. Ils
peuvent la supprimer à tout moment.

---

## 3. Modèle « multi-séances courtes » : architecture de l'expérience

### 3.1 Durée cible d'une séance

Une séance Billy ne doit pas dépasser **10 à 15 minutes** avec l'enfant.
Justification : c'est la durée au-delà de laquelle la charge cognitive et émotionnelle
dépasse les capacités d'un enfant de 6-10 ans, et au-delà de laquelle le risque de
relances suggestives par épuisement du répertoire fermé augmente.

En pratique, une séance peut être beaucoup plus courte : si l'enfant dit qu'il n'a rien à
dire (ou ne dit rien), la séance se clôt en 3-5 minutes. C'est une réponse valide.

### 3.2 Comment on ouvre une séance

**Première séance :**
Le flux complet V1 s'applique : accueil & transparence (P1), droit d'arrêter (P2), règles
de base (P3), entraînement au récit neutre (P4), ouverture (P5), réaction si signal (P6),
clôture (P7).

**Session de retour (l'enfant a déjà utilisé Billy) :**
- Accueil neutre et bref, sans « tu te souviens la dernière fois ».
- Rappel des règles de base (P3) en version abrégée : « Tu te souviens, tu peux me corriger
  si je dis quelque chose de faux, tu peux dire je ne sais pas, et tu peux t'arrêter quand
  tu veux. »
- Si la phase P4 (entraînement au récit neutre) a déjà été parcourue en session précédente :
  on la **répète sur un événement différent** (« raconte-moi ce que tu as fait aujourd'hui »)
  — pas la même histoire que la fois précédente, pour ne pas ancrer un souvenir déjà évoqué.
- L'ouverture (P5) est posée à nouveau, identique, neutre, sans référence à ce qui a été
  dit lors des sessions précédentes.

**Ce que Billy ne dit jamais en session de retour :**
- « La dernière fois tu m'avais dit que... »
- « Tu m'avais parlé de... tu veux continuer ? »
- « Est-ce qu'il s'est passé quelque chose depuis ? »
- Tout énoncé qui reformule, confirme ou prolonge un contenu déjà exprimé.

### 3.3 Comment on clôt une séance

La clôture est identique à la V1 (P7) : apaisement, remerciement, relais vers l'humain,
affichage de la marche à suivre (119). Elle ne comporte aucun « à la prochaine » ni
invitation à revenir. Elle indique simplement que l'adulte peut retourner dans l'espace
parent pour voir le rapport.

### 3.4 Comment on espace les sessions

Billy ne gère pas l'espacement. Il n'y a pas de notification, pas de rappel, pas de « tu
peux revenir demain ». L'adulte et l'enfant décident ensemble s'ils souhaitent rouvrir
l'application. Billy est disponible, pas insistant.

Un délai minimum de **24 heures** entre deux sessions sur le même dossier est imposé par
construction (côté serveur), pour éviter un usage répétitif compulsif dans une même journée,
sans être présenté à l'enfant comme une règle ou une règle de punition.

### 3.5 Comment on reprend

L'état de session persisté (voir §4) permet au moteur de savoir quelle phase NICHD a déjà
été parcourue. La reprise est mécanique, invisible pour l'enfant : Billy sait qu'il peut
passer l'entraînement long ou le refaire sur un sujet neutre différent, mais il ne dit pas
« on reprend là où on s'était arrêtés ». La continuité est silencieuse.

---

## 4. Règles de continuité : ce que l'outil retient et ce qu'il ne retient pas

### 4.1 Ce que l'outil RETIENT (état inter-sessions minimal)

| Information | Utilité | Durée de conservation |
|---|---|---|
| Phases NICHD complétées (P1 à P7, par session) | Savoir où en est le parcours pour ne pas re-parcourir P1-P3 au complet | Durée du dossier, purge à la clôture |
| Horodatage de chaque session (date, heure début/fin) | Rapport multi-sessions cohérent | Durée du dossier, purge à la clôture |
| Numéro de session (session 1, session 2...) | Structurer le rapport | Durée du dossier, purge à la clôture |
| Indicateur « signal sérieux déjà apparu » (booléen) | Ne plus descendre en-dessous de P6 si un signal a déjà été émis | Durée du dossier, purge à la clôture |
| Verbatim de chaque session (voir §5) | Rapport de séance agrégé | Durée du dossier, purge à la clôture |

### 4.2 Ce que l'outil NE RETIENT PAS

| Information interdite de persistance | Raison |
|---|---|
| Contenu émotionnel de l'enfant (« il semblait triste ») | Dépendance affective, sur-interprétation |
| Termes exacts utilisés par l'enfant sur le sujet sensible, réinjectés dans le dialogue | Contamination, suggestion |
| Résumé ou reformulation du récit de l'enfant, utilisable par Billy en session suivante | Contamination, suggestion |
| Préférence ou réaction à Billy (« il aimait quand Billy disait X ») | Dépendance affective, profilage |
| Données d'identification de l'enfant au-delà du prénom déclaré et de l'âge déclaré | Minimisation RGPD |
| Données comportementales analytiques (temps de pause, hésitation, vitesse d'élocution) | Minimisation RGPD, risque d'interprétation |

### 4.3 La règle d'or de la continuité

**L'état inter-sessions informe le moteur de navigation (quelle phase ?), jamais le contenu
des énoncés de Billy.**

Autrement dit : Billy sait qu'il est en session 2 et que P3 a déjà été fait. Il ne sait
pas, ne cite pas, ne réinjecte pas ce que l'enfant a dit en session 1.

### 4.4 Éviter le ré-interrogatoire

Le principal risque du modèle multi-sessions est que l'enfant soit amené à répéter son récit
sensible. Pour l'éviter :

- Si un signal sérieux a été émis en session N, le moteur entre automatiquement en mode
  **post-signal** pour toutes les sessions suivantes : la phase P5 (ouverture) est remplacée
  par une clôture douce + orientation renforcée. Billy ne réouvre pas la porte.
- Le moteur interdit structurellement toute formulation qui référencerait le contenu d'une
  session précédente (filtre anti-réinjection à ajouter à la couche `src/safety/`).
- Le rapport multi-sessions consolide les verbatim SESSION PAR SESSION, sans les fusionner
  ni produire de synthèse inter-sessions par défaut (voir §5).

### 4.5 Éviter l'attachement affectif

Le modèle de l'agent billy-ethique-ia-enfant identifie l'anthropomorphisme manipulateur et
la dépendance comme risques majeurs. Dans le contexte multi-sessions, ces risques augmentent
car la répétition crée naturellement un sentiment de familiarité.

Garde-fous spécifiques au multi-sessions :
- Pas de « je suis content de te revoir » ni d'expression simulant une continuité émotionnelle.
- Pas de personnalisation du ton en fonction des sessions passées.
- L'accueil en session de retour est identique à celui d'une nouvelle session, à la longueur
  près (version abrégée des règles de base).
- Le compteur de sessions n'est jamais montré à l'enfant.

---

## 5. Agrégation dans le rapport de séance

### 5.1 Structure du rapport multi-sessions

Le rapport de séance existant (docs/rapport-de-seance.md) est étendu pour accueillir
plusieurs sessions. La structure devient :

```
RAPPORT CONSOLIDÉ — [PRÉNOM DÉCLARÉ], [ÂGE DÉCLARÉ] ans
Nombre de sessions : N
Période : [date première session] — [date dernière session]
Version répertoire : X.Y
Mention : « Compte rendu factuel, sans interprétation. »

--- SESSION 1 ---
Date : JJ/MM/AAAA | Début : HH:MM | Fin : HH:MM | Durée : XX min
Phases parcourues : P1, P2, P3, P4, P5
[Déroulé verbatim horodaté — mêmes règles qu'en V1]
Signaux repérés cette session : [liste ou "aucun"]

--- SESSION 2 ---
Date : JJ/MM/AAAA | Début : HH:MM | Fin : HH:MM | Durée : XX min
Phases parcourues : P3 (abrégé), P4 (nouveau sujet neutre), P5
[Déroulé verbatim horodaté]
Signaux repérés cette session : [liste ou "aucun"]

--- RÉCAPITULATIF CONSOLIDÉ ---
Signaux apparus sur l'ensemble des sessions : [liste, avec session d'origine]
Niveau d'orientation global : [aucun signal / un ou plusieurs signaux sérieux]
Démarche recommandée : [standard — 119 en tête si signal]

--- RAPPELS DE POSTURE ---
[Identiques à la V1]
```

### 5.2 Règles d'agrégation (non négociables)

- Chaque session est un **bloc séparé et daté**. On ne fusionne pas les verbatim.
- Le récapitulatif consolidé **ne croise pas le contenu de deux sessions** pour en tirer une
  conclusion. Il liste les signaux, session par session, et en dresse l'inventaire factuel.
- **Pas de résumé en langage naturel inter-sessions** en V2 (réservé à une éventuelle V3,
  sous validation professionnelle renforcée, cf. rapport-de-seance.md §5).
- Le rapport est produit **localement**, en PDF, par session ET en version consolidée.
  L'adulte peut exporter le rapport consolidé ou des sessions isolées.
- Les mots de l'enfant sont reproduits **mot pour mot**, sans correction, sans reformulation,
  **dans chaque session où ils ont été prononcés**. Ils n'apparaissent pas dans les sessions
  où ils n'ont pas été prononcés.
- L'horodatage précis (date + heure) de chaque tour de parole est maintenu pour toutes les
  sessions, ce qui permettra au professionnel de situer chaque énoncé dans le temps.

### 5.3 Ce que le rapport ne fait pas

- Il ne compare pas les sessions (« cette fois l'enfant a dit X, alors qu'avant il avait dit Y »).
- Il ne produit pas de score de progression ou d'évolution.
- Il ne signale pas les contradictions entre sessions (c'est le travail du professionnel).
- Il ne fusionne pas les signaux en une qualification globale.

---

## 6. RGPD & sécurité

### 6.1 Surface de risque spécifique au multi-sessions

Le modèle multi-sessions crée une **surface de risque RGPD supérieure** à la V1 :
- Un état persisté entre sessions = des données ultra-sensibles d'un mineur **stockées
  entre deux moments d'usage**.
- Le rapport agrégé = un document encore plus complet sur la situation de l'enfant.
- La répétition des sessions = un profil temporel de l'enfant qui s'allonge.

### 6.2 Règles de minimisation

| Règle | Détail |
|---|---|
| Stockage local par défaut | L'état inter-sessions est stocké sur l'appareil, chiffré, pas en cloud. |
| Pas d'identifiant persistant de l'enfant | Le dossier est lié à l'appareil/session parente, pas à un compte enfant. |
| Durée de conservation maximale | 30 jours par défaut, configurable à la baisse par le parent, purge automatique. |
| Purge à la demande | Le parent peut supprimer tout le dossier depuis l'espace parent verrouillé. |
| Pas d'analytics inter-sessions | Aucun événement lié au contenu des échanges n'est envoyé vers un tiers analytique. |
| Chiffrement au repos | AES-256 ou équivalent, clé dérivée d'un code parental. |
| Chiffrement en transit | TLS 1.3 si le rapport est exporté ou si V2-2 (co-observation) est actif. |
| Pas d'entraînement LLM | Les données des sessions ne servent jamais à entraîner ou fine-tuner un modèle. |

### 6.3 DPIA (mise à jour requise)

Le passage au multi-sessions constitue un **changement de traitement** au sens du RGPD
(art. 35) : conservation prolongée de données sensibles d'un mineur. La DPIA existante
(condition bloquante du projet) doit être **mise à jour** pour couvrir ce nouveau mode
avant tout développement. C'est une condition bloquante spécifique à BILLY-E15.

### 6.4 Consentement

Le consentement parental éclairé (déjà requis en V1) doit être **étendu** pour couvrir
explicitement la persistance inter-sessions et la durée de conservation. Le parent doit
pouvoir désactiver le multi-sessions (mode session unique) sans perdre les autres
fonctionnalités.

---

## 7. Épopée BILLY-E15 et tickets

### BILLY-E15 — Multi-séances courtes

> Permettre à un enfant de revenir sur Billy en plusieurs sessions courtes, sans jamais
> répéter son récit sensible, sans créer d'attachement affectif, en maintenant un rapport
> de séance consolidé et conforme au RGPD.

**Blocage de l'épopée :** BILLY-E15 est bloquée par (a) la DPIA mise à jour (§6.3),
(b) la validation professionnelle NICHD du modèle de reprise, (c) la levée des conditions
bloquantes V1. Elle ne commence qu'après la V1 mise en production.

---

#### BILLY-E15 / Spécifications & garde-fous

**BILLY-101 — Spécification fonctionnelle du modèle multi-sessions**
Etat : à faire | Bloqué par : conditions bloquantes V1
Intitulé : Rédiger la spécification détaillée du moteur d'état inter-sessions
(quelles données persistées, format, durée de vie, API interne).
Critère d'acceptation : la spec est approuvée par factory-expert-conformite,
billy-ethique-ia-enfant et billy-pedopsychologue. Elle couvre explicitement les §4.1,
4.2, 4.3, 4.4 de ce document.

**BILLY-102 — DPIA mise à jour pour la persistance inter-sessions**
Etat : à faire | Bloqué par : BILLY-101, DPIA V1
Intitulé : Mettre à jour la DPIA pour couvrir la conservation inter-sessions
(nouvelles finalités, durées, mesures de sécurité, droits RGPD).
Critère d'acceptation : DPIA validée par le DPO. Le nouveau traitement est couvert
et aucune finalité nouvelle non déclarée n'est introduite.

**BILLY-103 — Validation professionnelle du modèle de reprise**
Etat : à faire | Bloqué par : BILLY-101
Intitulé : Soumettre le modèle de reprise (§3.2) à validation par un expert NICHD
et un pédopsychiatre pour confirmer que la session de retour n'induit pas de ré-interrogatoire.
Critère d'acceptation : avis écrit favorable de l'expert NICHD et du pédopsychiatre sur
le script de session de retour, notamment : absence de réinjection du contenu passé,
formulations de reprise conformes au principe d'entretien unique.

---

#### BILLY-E15 / Moteur d'état

**BILLY-104 — Persistance de l'état de session (local, chiffré)**
Etat : à faire | Dépend de : BILLY-101, BILLY-102, BILLY-103
Intitulé : Implémenter le stockage local chiffré de l'état inter-sessions (phases
parcourues, horodatage, indicateur signal, numéro de session). Aucune donnée de contenu
enfant dans cet état.
Critère d'acceptation : (a) seules les données de §4.1 sont persistées, (b) AES-256
au repos, (c) test de décompilation : aucun verbatim enfant dans le store d'état,
(d) purge complète fonctionnelle en < 1 clic depuis l'espace parent.

**BILLY-105 — Moteur de navigation inter-sessions (quelle phase au retour ?)**
Etat : à faire | Dépend de : BILLY-104
Intitulé : Implémenter la logique qui détermine, en session de retour, le point
d'entrée dans les phases NICHD (P3 abrégé, P4 nouveau sujet neutre, P5 identique)
sans référence au contenu passé.
Critère d'acceptation : (a) la session de retour ne rejoue jamais P1 complet,
(b) P4 utilise systématiquement un sujet neutre différent de la session précédente,
(c) aucun énoncé Billy ne contient de référence au contenu d'une session antérieure
(testé sur 20 scénarios de reprise).

**BILLY-106 — Mode post-signal : verrouillage de P5 après signal sérieux**
Etat : à faire | Dépend de : BILLY-104, BILLY-105
Intitulé : Si l'indicateur « signal sérieux » est positionné à vrai dans l'état,
les sessions suivantes entrent directement en clôture + orientation renforcée
sans repasser par P5.
Critère d'acceptation : (a) test avec état signal=true : P5 n'est jamais présenté,
(b) l'orientation 119 est affichée à chaque session suivante dans l'espace parent,
(c) Billy ne pose aucune question ouverte sur le sujet sensible en mode post-signal.

**BILLY-107 — Délai minimum inter-sessions (24 h, côté serveur)**
Etat : à faire | Dépend de : BILLY-104
Intitulé : Implémenter le délai minimum de 24 h entre deux sessions sur le même
dossier. Le délai est appliqué silencieusement, sans explication à l'enfant.
Critère d'acceptation : (a) une tentative de démarrer une session < 24 h après la
précédente est bloquée côté serveur, (b) le parent voit un message neutre dans
l'espace parent (ex. : « Billy est disponible de nouveau demain »), (c) aucun
message à l'enfant ne crée une frustration ou une culpabilisation.

---

#### BILLY-E15 / Filtre anti-réinjection

**BILLY-108 — Règle anti-réinjection dans src/safety/**
Etat : à faire | Dépend de : BILLY-105
Intitulé : Ajouter une 13e règle à la couche src/safety/ : bloquer avant TTS tout
énoncé Billy qui référence explicitement ou implicitement le contenu d'une session
antérieure (reformulation, confirmation, prolongement d'un récit passé).
Critère d'acceptation : (a) la règle est documentée et testable, (b) 20 cas de test
« réinjection » sont définis et refusés à 100 %, (c) le filtre est fail-closed
(en cas de doute, l'énoncé est bloqué).

**BILLY-109 — Red-team multi-sessions (billy-ethique-ia-enfant)**
Etat : à faire | Dépend de : BILLY-105, BILLY-106, BILLY-108
Intitulé : Mandater billy-ethique-ia-enfant pour red-teamer 15 scénarios
multi-sessions (tentative de ré-interrogatoire, attachement simulé, réinjection,
dark pattern de retour, confusion de sessions).
Critère d'acceptation : 0 dérive non bloquée par les garde-fous. Chaque dérive
identifiée débouche sur un ticket correctif avant release.

---

#### BILLY-E15 / UX et script de retour

**BILLY-110 — Script de session de retour (répertoire fermé)**
Etat : à faire | Dépend de : BILLY-103
Intitulé : Rédiger et valider pro les formulations de session de retour (accueil
neutre, P3 abrégé, P4 sur sujet neutre différent, P5 identique) à intégrer dans
script-billy.json.
Critère d'acceptation : (a) formulations validées par expert NICHD et pédopsychiatre
(lien avec BILLY-103), (b) aucune formulation ne fait référence au passé ou ne
simule une continuité affective, (c) passées par la couche anti-suggestion
(12 règles + règle 13 de BILLY-108), (d) intégrées dans script-billy.json avec
statut « validé ».

**BILLY-111 — UX espace parent : entrée « Reprendre »**
Etat : à faire | Dépend de : BILLY-104
Intitulé : Dans l'espace parent (derrière verrou), afficher les sessions passées
(date, durée, indicateur signal oui/non) et proposer un bouton « Commencer une
nouvelle session » — jamais « reprendre » ou « continuer » pour éviter l'idée
de continuité narrative.
Critère d'acceptation : (a) l'écran ne mentionne pas le contenu des sessions
passées, (b) le libellé ne suggère pas une continuité du récit (rejeté : « reprendre
où on en était »), (c) la purge de tout le dossier est accessible en 2 clics maximum.

---

#### BILLY-E15 / Rapport multi-sessions

**BILLY-112 — Extension du rapport de séance : structure multi-sessions**
Etat : à faire | Dépend de : BILLY-104
Intitulé : Étendre le module src/report/ pour produire un rapport consolidé
multi-sessions conforme à la structure définie au §5.1 de ce document.
Critère d'acceptation : (a) chaque session est un bloc séparé daté, (b) le
récapitulatif consolidé liste les signaux par session sans les fusionner,
(c) aucun résumé en langage naturel inter-sessions n'est produit, (d) le rapport
est exportable en PDF session par session ET en version consolidée, (e) le verbatim
d'une session N ne réapparaît pas dans les blocs d'une session N+1.

**BILLY-113 — Test RGPD du rapport consolidé**
Etat : à faire | Dépend de : BILLY-112
Intitulé : Vérifier que le rapport consolidé ne contient aucune donnée au-delà de
celles définies au §4.1 (pas de données analytiques, pas de profil comportemental).
Critère d'acceptation : audit technique du contenu du PDF généré sur 10 dossiers
de test ; 0 donnée hors périmètre §4.1 identifiée.

---

#### BILLY-E15 / Sécurité & conformité

**BILLY-114 — Tests de sécurité de la persistance inter-sessions**
Etat : à faire | Dépend de : BILLY-104
Intitulé : Mandater factory-security-auditor pour auditer le stockage local chiffré
(chiffrement, accès, résistance à extraction physique de l'appareil, purge
irréversible).
Critère d'acceptation : rapport d'audit vert sur les points : (a) clé de chiffrement
non lisible sans code parental, (b) purge rend les données irrécupérables, (c) aucun
log système ne contient de verbatim enfant.

**BILLY-115 — Mise à jour du consentement parental pour le multi-sessions**
Etat : à faire | Dépend de : BILLY-102
Intitulé : Mettre à jour le parcours de consentement parental pour couvrir
explicitement la persistance inter-sessions (durée, contenu, droit de suppression,
option désactivation multi-sessions).
Critère d'acceptation : (a) le consentement mentionne explicitement la persistance
et sa durée, (b) l'option « session unique » est proposée sans friction excessive,
(c) validé par factory-expert-conformite.

---

#### Récapitulatif des tickets BILLY-E15

| Ticket | Intitulé court | Etat | Dépend de |
|---|---|---|---|
| BILLY-101 | Spec fonctionnelle multi-sessions | à faire | conditions V1 |
| BILLY-102 | DPIA mise à jour | à faire | BILLY-101 |
| BILLY-103 | Validation pro modèle de reprise | à faire | BILLY-101 |
| BILLY-104 | Persistance état local chiffré | à faire | BILLY-101, 102, 103 |
| BILLY-105 | Moteur navigation inter-sessions | à faire | BILLY-104 |
| BILLY-106 | Mode post-signal (verrou P5) | à faire | BILLY-104, 105 |
| BILLY-107 | Délai minimum 24 h | à faire | BILLY-104 |
| BILLY-108 | Règle anti-réinjection (safety rule 13) | à faire | BILLY-105 |
| BILLY-109 | Red-team multi-sessions | à faire | BILLY-105, 106, 108 |
| BILLY-110 | Script session de retour (répertoire) | à faire | BILLY-103 |
| BILLY-111 | UX espace parent : écran sessions | à faire | BILLY-104 |
| BILLY-112 | Rapport consolidé multi-sessions | à faire | BILLY-104 |
| BILLY-113 | Test RGPD rapport consolidé | à faire | BILLY-112 |
| BILLY-114 | Audit sécurité persistance | à faire | BILLY-104 |
| BILLY-115 | Consentement parental étendu | à faire | BILLY-102 |

---

## 8. Risques & garde-fous spécifiques au multi-sessions

| Risque | Gravité | Garde-fou |
|---|---|---|
| Ré-interrogatoire involontaire (reprise qui relance le récit sensible) | Critique | BILLY-106 (verrou post-signal) + BILLY-108 (anti-réinjection) + BILLY-103 (validation pro) |
| Attachement affectif par répétition | Élevé | BILLY-110 (script neutre) + interdiction de toute formulation de continuité affective + BILLY-109 (red-team) |
| Fuite de l'état inter-sessions (extraction physique de l'appareil) | Critique | BILLY-104 (chiffrement) + BILLY-114 (audit sécurité) |
| Conservation excessive des données (durée) | Élevé | Purge auto 30 jours + BILLY-115 (consentement) + BILLY-102 (DPIA) |
| Parent = auteur, accède au dossier | Critique | Espace parent verrouillé (hérité V1) + rapport accessible seulement derrière verrou |
| Enfant sollicité à revenir (dark pattern) | Élevé | Pas de notification, pas de rappel, pas de « à la prochaine » dans le script, BILLY-109 (red-team) |
| Accumulation de données croisées entre sessions produisant un profil | Élevé | BILLY-104 (périmètre strict de l'état), BILLY-113 (test RGPD), BILLY-108 (anti-réinjection) |
| Confusion entre sessions par le moteur (verbatim session N injecté en N+1) | Critique | BILLY-105 (moteur), BILLY-108 (filtre), BILLY-109 (red-team) |

---

## 9. Tensions résolues — synthèse des arbitrages

**Tension 1 — Continuité SANS ré-interroger**
Résolution : l'état inter-sessions retient uniquement la progression dans les phases NICHD
(où en sommes-nous ?), jamais le contenu. Le mode post-signal verrouille P5 dès le premier
signal sérieux. L'entretien unique est respecté : on ne demande jamais à l'enfant de répéter.

**Tension 2 — Pas d'attachement affectif**
Résolution : la continuité est silencieuse côté enfant. Aucun énoncé Billy ne simule la
mémoire affective. Le script de retour est neutre et identique pour tous les enfants.
Billy n'exprime pas qu'il « se souvient » ou qu'il est « content de revoir » l'enfant.

**Tension 3 — RGPD**
Résolution : stockage local chiffré, périmètre de données minimal défini contractuellement
(§4.1), purge auto à 30 jours, consentement étendu, DPIA mise à jour (condition bloquante
BILLY-102 avant tout développement).

**Tension 4 — Qui décide**
Résolution : c'est toujours l'enfant qui décide de parler ou non. Le parent décide d'ouvrir
l'application. Billy ne sollicite jamais, ne notifie jamais, ne relance jamais. Le délai
minimum 24 h est appliqué silencieusement, sans frustration introduite côté enfant.

**Tension 5 — Agrégation dans le rapport**
Résolution : sessions séparées et datées dans le rapport, verbatim dans le bloc de la session
d'origine, récapitulatif consolidé factuel (signaux par session, sans fusion de contenu),
pas de résumé inter-sessions en V2.

---

## Synthèse à l'attention du Product Owner (8-12 lignes)

Le modèle multi-séances courtes est **fondamentalement simple dans son principe et complexe
dans ses garde-fous**. Le principe est de permettre à l'enfant de revenir, sans jamais lui
demander de répéter quoi que ce soit de sensible. La complexité tient à deux risques
antagonistes à maintenir sous contrôle en permanence : la réinjection (le moteur qui glisse
un contenu passé dans une formulation présente) et l'attachement (le ton qui simule une
mémoire affective). Ces deux risques sont gérés par des couches distinctes : le moteur de
navigation (BILLY-105) et le filtre anti-réinjection (BILLY-108) pour la réinjection ;
le script de retour validé pro (BILLY-110) et l'interdiction de toute formulation de
continuité affective pour l'attachement. La condition bloquante la plus structurante est
la **validation professionnelle NICHD du modèle de reprise** (BILLY-103) : si un expert
NICHD estime que la session de retour, même avec un script neutre, risque d'induire un
ré-interrogatoire implicite, tout l'édifice s'arrête là. La DPIA mise à jour (BILLY-102)
est l'autre condition sine qua non, car la persistance inter-sessions change fondamentalement
le profil de risque RGPD. On ne commence aucun développement applicatif BILLY-E15 avant
que BILLY-101, BILLY-102 et BILLY-103 soient validés.
