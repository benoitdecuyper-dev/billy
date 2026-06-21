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

- **Cas d'usage fort** : un professionnel (119, psy, enquêteur) accompagne à distance.
- **Garde-fous critiques** (cette fonctionnalité est la plus sensible du projet) :
  - **Appairage contrôlé et authentifié** : seul un destinataire **explicitement autorisé** y
    accède (jamais un lien ouvert).
  - **Conflit d'intérêts MAJEUR** : le détenteur de l'autorité parentale **peut être l'auteur**.
    Le 2ᵉ téléphone **ne doit pas** pouvoir être un agresseur potentiel → réfléchir à un
    appairage via un **tiers de confiance / professionnel**, pas « n'importe quel parent ».
  - **L'observateur observe, ne pilote pas** : il ne doit pas pouvoir souffler/induire des
    questions (risque de contamination). Comme à Barnahus : il **note des points**, il ne
    **mène pas**.
  - **Sécurité** : flux **chiffré de bout en bout**, aucune fuite tierce, aucun enregistrement
    par le 2ᵉ appareil sans le même cadre légal que V2-1.
  - **Transparence** : l'enfant sait qu'une personne suit la conversation.
- **À valider impérativement** avec juriste + DPO + professionnels avant toute conception.

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

## Backlog
À intégrer comme épopées : **BILLY-E12** (trace audio), **BILLY-E13** (2ᵉ téléphone /
co-observation Barnahus), **BILLY-E14** (préface adulte). Toutes **bloquées** tant que les
conditions (validation pro + DPIA + cadre sécurité) ne sont pas levées.
