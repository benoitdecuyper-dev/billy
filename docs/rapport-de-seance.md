# Rapport de séance & récap d'orientation — spécification

> Fonctionnalité demandée : à la fin d'un échange, Billy produit **un rapport exhaustif de
> l'échange**, **un récapitulatif** des éléments importants selon ce que l'enfant a dit, et **la
> démarche à suivre si un risque est identifié**.
>
> Cette fonctionnalité est **directement alignée** sur la posture de référence
> (`posture-reference_V2.md`) : les protocoles demandent de **« noter les mots exacts de
> l'enfant, la date, l'heure, le contexte »** puis d'**orienter**. Le rapport EST ce verbatim
> transmissible. Voir garde-fous ci-dessous : il **n'interprète pas, ne qualifie pas, ne conclut
> pas**.

## 1. À quoi sert le rapport (et à qui)

- **But** : donner à l'**adulte de confiance / au professionnel (119, médecin, enquêteur)** un
  **compte rendu fidèle** à transmettre. CIIVISE : la personne qui reçoit la parole est « un
  **relais essentiel** », pas un enquêteur.
- **Ce n'est PAS** : un diagnostic, une preuve, une qualification des faits, une désignation
  d'auteur, ni un score de probabilité d'abus. *« Signaler n'est pas enquêter. »*

## 2. Contenu du rapport

1. **En-tête** : date, heure de début/fin, durée ; prénom + âge **déclarés** (minimisés) ;
   version du répertoire utilisé. Mention : *« Compte rendu factuel, sans interprétation. »*
2. **Déroulé verbatim** : pour chaque tour — la phrase **exacte** dite par Billy + la **réponse
   de l'enfant transcrite mot pour mot** (sans correction ni reformulation), horodatée. C'est le
   cœur : *les mots de l'enfant*.
3. **Récapitulatif factuel** : reprise neutre des éléments que l'enfant a **lui-même** exprimés,
   **dans ses mots**, sans rien ajouter, sans interpréter, sans nommer d'acte/auteur/lieu non
   dits.
4. **Signaux repérés** : liste factuelle des signaux observés pendant la séance (ex. mention
   d'une peur, d'une douleur, d'un « secret », détresse/pleurs, mutisme), rattachés aux **10
   signaux d'alerte** de référence — **sans score, sans conclusion**.
5. **Niveau d'orientation** (seuil, pas verdict) :
   - *Aucun signal* → pas d'alerte ; ressources de prévention (éducation par âge).
   - *Un ou plusieurs signaux sérieux* → **« Démarche recommandée »** (§3).
6. **Rappels de posture pour l'adulte** : croire l'enfant, ne pas confronter l'agresseur
   présumé, ne pas faire répéter, transmettre **ce verbatim** au professionnel, ne pas rester seul.

## 3. « Démarche à suivre si risque identifié » (orientation standardisée)

Présentée comme une **marche à suivre standard** (jamais comme un diagnostic) :
- **Danger immédiat** → **17 / 112** (ou **15 / 18** si blessé / en détresse).
- **Réflexe principal** → **119** (gratuit, 24/7, confidentiel ; tchat/formulaire sur allo119.gouv.fr) — *même en cas de simple doute, pour conseil*.
- **Avis médical** → médecin traitant / **urgences pédiatriques** / **UAPED**.
- **Cadres institutionnels** (via le 119 / un pro) : **CRIP** (information préoccupante),
  **procureur** (signalement si gravité).
- **Conflit d'intérêts** : si un détenteur de l'autorité parentale peut être en cause, l'accès
  au 119 et aux urgences reste **toujours ouvert**, sans condition.

## 4. Garde-fous (non négociables)

- **Aucune interprétation/qualification/conclusion**, aucun score de probabilité, aucune
  désignation d'auteur. Le rapport rapporte ; il ne juge pas.
- Le **récap** et les **signaux** sont produits par une **logique transparente et auditable**
  (mots-clés/règles validés par les pros), pas une « boîte noire » qui décide. En V1, on
  **n'utilise pas de résumé IA libre** : on horodate le verbatim + on coche des signaux prédéfinis.
- **RGPD — données ultra-sensibles** (mineur + santé + pénal) : pas de stockage cloud par
  défaut ; rapport **généré localement**, **exportable** (PDF) pour être remis au professionnel ;
  chiffrement si conservé ; suppression facile ; **aucun analytics**, aucune revente. Cf.
  `rgpd-donnees-sensibles.md`.
- **Transparence** : l'enfant et l'adulte savent qu'un compte rendu est produit, et à quoi il sert.
- **Destinataire maîtrisé** : penser qui peut générer/voir le rapport (espace parent verrouillé),
  compte tenu du conflit d'intérêts possible.

## 5. Évolution (V2, sous validation pro)
Un **résumé en langage naturel** des propos de l'enfant (toujours sans qualifier ni conclure),
et une aide à la structuration pour le professionnel — **uniquement** après validation par des
professionnels et tests de non-suggestion/non-interprétation.

---

> À intégrer au backlog (nouvelle épopée **BILLY-E11 « Rapport & orientation »**) et à faire
> valider avec les associations en même temps que la posture. Bloqué par les mêmes conditions
> (validation pro + DPIA) que le reste du développement applicatif.
