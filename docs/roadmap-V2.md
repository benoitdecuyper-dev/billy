# Roadmap V2 — fonctionnalités à venir

> Fonctionnalités demandées pour **après la V1** (qui reste « support & orientation »,
> Option A). Capturées ici avec leurs garde-fous. **Toutes** restent bloquées par les
> conditions du projet (validation pro + DPIA) et, vu leur sensibilité (audio/vidéo d'un
> enfant), exigent un cadre RGPD/sécurité renforcé. Voir `rgpd-donnees-sensibles.md`.

## V2-1 — Trace audio de l'échange (enregistrement)

**But.** Conserver une trace fidèle de la séance (au-delà du verbatim transcrit), utile pour
le professionnel.

- **Aligné** avec le protocole NICHD (l'entretien est enregistré et c'est expliqué à l'enfant)
  et avec le rapport de séance (`rapport-de-seance.md`).
- **Garde-fous** : **désactivé par défaut** (`ENABLE_RECORDING=false`), activable seulement
  avec **base légale + consentement parental éclairé** ; **chiffrement** au repos ;
  **conservation limitée + purge** ; **hébergement UE** ; **aucun cloud tiers non encadré** ;
  transparence (l'enfant sait qu'on enregistre, dit avec ses mots).
- **Point dur** : un enregistrement peut devenir une pièce → ne pas prétendre à une valeur de
  preuve (Billy n'est pas un outil forensique), mais éviter de **dégrader** une future
  procédure ; à border avec le juriste.

## V2-2 — 2ᵉ téléphone connecté (vidéo + audio en direct) — « modèle Barnahus »

**But.** Permettre à un **adulte de confiance / professionnel** de suivre la conversation en
direct (audio + vidéo) depuis un autre appareil. C'est l'esprit **Barnahus** (un intervenant
avec l'enfant, un autre qui observe derrière la vitre).

- **Parcours / UX (propre, sans friction)** : côté **adulte**, après la préface (V2-3), un
  **QR code** est affiché. On le **scanne avec l'autre smartphone** pour **lancer la séance de
  l'enfant** et **appairer** les deux appareils — l'adulte suit alors la conversation (audio +
  vidéo) depuis son téléphone. Aucun lien à taper, appairage en un scan.
  - Le QR encode un **jeton d'appairage à usage unique, à durée de vie courte**, lié à une
    session chiffrée (pas un identifiant devinable, pas un lien public).
- **Cas d'usage fort** : un professionnel (119, psy, enquêteur) accompagne à distance.
- **Principe retenu (simplifié) : observateurs strictement PASSIFS.** On peut connecter
  **plusieurs téléphones** qui **voient et entendent** la conversation, mais qui **ne peuvent en
  rien interférer** : aucun canal de retour vers Billy ou l'enfant, pas de micro renvoyé, pas de
  message, pas de « souffler » une question. **Lecture seule.** Du coup, le risque de
  contamination tombe de lui-même, et on ne se prend pas la tête sur « qui appaire » : un
  observateur, même mal intentionné, **ne peut rien changer** au déroulé.
- **Garde-fous restants** :
  - **Appairage par QR** : jeton à usage unique, courte durée, session chiffrée.
  - **Sécurité** : flux **chiffré de bout en bout**, aucune fuite tierce ; pas d'enregistrement
    par l'observateur sans le même cadre légal que V2-1.
  - **Transparence** : l'enfant sait qu'une ou plusieurs personnes suivent la conversation.

## V2-3 — Préface IA pour l'adulte (onboarding posture)

**But.** Avant la séance, une **IA s'adresse à l'adulte** pour lui **expliquer la démarche et
la posture** : pourquoi des questions ouvertes, pourquoi ne pas interroger soi-même, ce que
Billy va faire, comment réagir, et la marche à suivre/orientation.

- **Très aligné** avec la posture de référence (`posture-reference_V2.md`) et l'agent
  `billy-accompagnement-parents` : on **dé-escalade** le parent et on l'**éduque** AVANT.
- **Contenu** (puisé dans la posture) : les bonnes réactions (« Je te crois », « Ce n'est pas
  ta faute »), les pièges (ne pas promettre le secret, ne pas faire répéter, ne pas confronter),
  le rôle de Billy (accueillir/orienter, pas enquêter), et l'orientation (119…).
- **Note** : c'est un **bon candidat à anticiper** (utile, peu risqué côté enfant car ça
  s'adresse à l'adulte) — pourrait même enrichir l'espace parent de la V1.
- **Garde-fous** : transparence (IA, pas un pro), pas de conseil juridique/médical personnalisé,
  orientation vers les professionnels.

---

## V2-4 — UX du site (identité & interaction)

- **Moins genré → palette ORANGE.** Abandonner le rose (perçu comme genré) au profit d'une
  identité **orange** chaleureuse et neutre, cohérente avec l'écureuil. *(Appliqué en avance sur
  la démo.)*
- **L'écureuil s'anime quand il parle** : bouche/mouvement synchronisés à la voix (la frame
  « bouche ouverte » alignée existe ; à fiabiliser).
- **Détection automatique de fin de parole (VAD)** : Billy **détecte quand l'enfant a fini de
  parler** et enchaîne tout seul — sans bouton « J'ai fini ». À régler avec prudence pour **ne
  jamais couper** l'enfant (seuils de silence généreux, jamais d'interruption).

## V2-5 — Cadrage du motif (intégré à la préface) — ✅ SIMPLIFIÉ (2026-06-21)

> **Décision : pas de cadrage vocal temps réel séparé pour l'instant.** Le besoin est couvert
> par un **questionnaire rapide « pourquoi venez-vous ? »** intégré à la **préface adulte**
> (`public/adulte.html`) : précaution / doute / suspicion précise / situation en institution +
> note libre. **Cloisonné** : l'info sert au suivi/orientation et au rapport, **jamais** transmise
> à Billy ni à ses questions à l'enfant. *(La version « échange vocal temps réel » reste une piste
> future ; le détail ci-dessous est conservé pour mémoire.)*

### (archive) Cadrage vocal IA avec le parent (avant la séance)

**But.** Une **phase de cadrage en voix temps réel** où **le parent décrit la situation**, pour
**trier** et **contextualiser** avant que l'enfant ne parle à Billy. Prolonge la préface (V2-3) :
la préface *explique* la posture ; le cadrage *écoute* le parent.

- **Exemples de situations à distinguer** :
  - *Dépistage « au cas où »* (prévention, aucun élément précis).
  - *Suspicion ciblée* (ex. « l'ATSEM de l'école semble avoir touché ma fille »).
- **Ce que le cadrage produit** :
  - un **niveau de départ** (prévention vs suspicion) qui adapte le ton et l'orientation ;
  - un **contexte** versé dans le **rapport de séance** (récit du parent, daté), utile au pro ;
  - le bon aiguillage (ex. suspicion sérieuse → mettre le 119 en avant d'emblée).
- **GARDE-FOU CRITIQUE — pare-feu anti-contamination** : si le parent **nomme** un acte, un lieu
  ou une **personne soupçonnée**, ces informations **NE DOIVENT JAMAIS** être réutilisées par
  Billy avec l'enfant (Billy ne nomme jamais en premier). Le cadrage parent est **cloisonné** de
  la session enfant : il informe le tri et le rapport, **pas** les questions posées à l'enfant.
- **Autres garde-fous** : transparence (IA, pas un pro) ; pas de conseil juridique/médical
  personnalisé ; RGPD (le récit du parent peut nommer un tiers → données sensibles, minimisation,
  pas de qualification ni de désignation par l'app) ; le parent reste orienté vers les pros.

## V2-6 — Vidéo tuto pour les parents — ❌ ABANDONNÉ (2026-06-21)

> **Décision : pas de vidéo tuto pour l'instant — la préface adulte (`adulte.html`) couvre le
> besoin** (repères de posture + que faire). Détail conservé ci-dessous pour mémoire.

### (archive) Vidéo tuto pour les parents

**But.** Une **courte vidéo pédagogique** qui explique aux parents comment utiliser Billy et,
surtout, **la bonne posture** : pourquoi ne pas interroger soi-même, comment réagir, la marche à
suivre.

- **Contenu** (puisé dans `posture-reference_V2.md` et `billy-accompagnement-parents`) : à quoi
  sert Billy (accueillir/orienter, pas enquêter) ; les bonnes réactions (« je te crois », « ce
  n'est pas ta faute ») ; les pièges (ne pas promettre le secret, ne pas faire répéter, ne pas
  confronter) ; le rapport + la démarche d'orientation (119…).
- **Forme** : ton rassurant, **cohérent avec l'identité** (Billy l'écureuil, palette orange,
  voix Chloé) ; sous-titrée ; courte (≈ 1–2 min). Production possible via les outils de
  génération vidéo.
- **Garde-fous** : message validé avec les associations ; transparence (Billy = programme) ;
  oriente vers les professionnels ; pas de conseil médical/juridique personnalisé.

## Backlog
À intégrer comme épopées : **BILLY-E12** (trace audio), **BILLY-E13** (2ᵉ téléphone /
co-observation Barnahus), **BILLY-E14** (préface adulte). Toutes **bloquées** tant que les
conditions (validation pro + DPIA + cadre sécurité) ne sont pas levées.
