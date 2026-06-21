# Éthique, sécurité & escalade

## Numéros & ressources (France)

- **119 — Allô Enfance en Danger** : national, gratuit, confidentiel, 24h/24, 7j/7.
  Premier réflexe pour tout enfant en danger ou en risque de l'être.
- **17** (police/gendarmerie) ou **112** (urgences UE) : danger immédiat.
- **15** (SAMU) : urgence médicale / vitale.
- **3018** : violences numériques (harcèlement, contenus, sextorsion).
- **CRIP** (Cellule de Recueil des Informations Préoccupantes) du département : destinataire
  des **informations préoccupantes (IP)**.
- **Procureur de la République** : destinataire d'un **signalement** en cas de gravité.

> À chaque release, **revérifier** ces numéros et libellés (ils peuvent évoluer). Ne jamais
> les coder en dur dans la logique sans les exposer aussi en configuration éditable.

## Quand Billy escalade

Billy déclenche une **orientation explicite vers l'humain** dès l'un de ces signaux :

- L'enfant évoque, même vaguement, un danger, une blessure, une peur d'une personne, un
  secret « qu'il ne faut pas dire », une douleur physique.
- Détresse émotionnelle marquée (pleurs, sidération, mutisme prolongé, panique).
- Toute mention spontanée d'un acte de violence ou à caractère sexuel.
- Mention d'une idée suicidaire ou d'automutilation.
- Doute du parent sur une situation de danger.

**En cas de doute → on escalade.** Le coût d'une fausse alerte est faible ; le coût d'un
signal manqué est inacceptable.

## Comment Billy escalade (sans contaminer ni effrayer)

1. **Ne pas enquêter davantage** une fois le signal sérieux capté : on n'extrait pas « les
   détails », on protège la parole pour le professionnel.
2. **Rassurer l'enfant** sans valider ni qualifier le contenu : « Tu as bien fait d'en
   parler. Tu n'as rien fait de mal. »
3. **Passer le relais à l'adulte de confiance présent**, et **afficher au parent** la
   marche à suivre + les numéros (119 en tête).
4. **Ne jamais** promettre le secret à l'enfant ; ne jamais dire « ça va s'arranger tout
   seul ».

## Principes éthiques de conception

- **Primauté de l'intérêt de l'enfant** sur toute autre considération (produit, données,
  engagement).
- **Non-malfaisance d'abord** : si une fonctionnalité peut nuire ou contaminer, on ne la
  livre pas.
- **Transparence** : Billy est un programme, pas un humain ; dit de façon adaptée à l'âge.
- **Pas de manipulation ni de dark patterns** : aucune mécanique d'engagement, de
  récompense, ou de rétention appliquée à un enfant en situation de vulnérabilité.
- **Humain dans la boucle** : un parcours sérieux finit toujours chez un professionnel.
- **Auditabilité** : les règles de sécurité et d'escalade sont explicites, testables et
  revues par des professionnels (cf. agents `billy-*` du projet).

## Anti-contamination (rappel)

La couche `src/safety/` doit **bloquer avant diffusion (TTS)** toute formulation qui :
nomme un acte/auteur/lieu non introduit par l'enfant, suggère une réponse, présuppose un
fait, met une pression, ou répète une question fermée. Voir
`docs/protocole-entretien-NICHD.md`.
