# Note de cadrage — Billy (V1)

> **Statut : BROUILLON — en attente du cadrage par `factory-chef-de-projet`.**
> Selon la règle du projet (cf. `CLAUDE.md`), on ne développe pas avant cadrage validé,
> consultation de `factory-expert-conformite` + des experts `billy-*`, et feu vert utilisateur.

## Vision

Billy : application smartphone à IA conversationnelle, incarnée par une avatar
bienveillante, qui **aide à repérer si un enfant a pu subir une violence ou une agression
sexuelle**, via un **dialogue vocal en temps réel non-suggestif**, tout en **soutenant le
parent** souvent sous le choc.

## Problème

Un parent qui soupçonne quelque chose questionne souvent mal (sous l'émotion, avec des
questions fermées/suggestives) — ce qui **traumatise davantage l'enfant** et **contamine
sa parole**, la rendant inexploitable. Billy vise à offrir un cadre sûr, non-suggestif, et
à orienter vers les bons professionnels.

## Périmètre V1 (proposé — à valider)

- Avatar Billy + **boucle vocale temps réel** (STT → moteur → TTS) sur PWA mobile.
- Moteur d'entretien suivant les **phases NICHD** (cf. `docs/protocole-entretien-NICHD.md`).
- **Couche sûreté** : anti-suggestion + détection de signaux + **escalade 119**.
- **Espace parent** : psychoéducation, dé-escalade émotionnelle, marche à suivre, numéros.
- Confidentialité maximale (cf. `docs/rgpd-donnees-sensibles.md`), pas d'enregistrement
  par défaut.

## Hors périmètre V1 (proposé)

- Tout verdict / score de crédibilité (interdit par principe).
- Audition à valeur de preuve (réservée aux professionnels).
- Publication sur les stores (V2 / React Native).

## Conditions bloquantes avant développement

1. Validation des principes NICHD + parcours par des **professionnels** (pédopsychiatrie,
   protection de l'enfance, magistrat/enquêteur) — via les agents `billy-*`.
2. **DPIA** (analyse d'impact RGPD) et avis DPO.
3. Validation éthique (IA face à un enfant vulnérable).

## Risques majeurs

- Contamination de la parole → inexploitabilité + préjudice à l'enfant.
- Faux négatif (signal manqué) / faux positif (alarme injustifiée).
- Détresse provoquée chez l'enfant ; substitution au professionnel.
- Fuite de données ultra-sensibles.

## Prochaine étape

Lancer `factory-chef-de-projet` pour cadrer la V1, en s'appuyant sur les nouveaux experts
`billy-*` (voir `.claude/agents/`).
