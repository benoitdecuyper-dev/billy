# src/safety — couche sûreté (à concevoir au cadrage)

Deux responsabilités critiques (cf. `docs/ethique-securite-escalade.md`,
`docs/protocole-entretien-NICHD.md`) :

1. **Filtre anti-suggestion (avant TTS)** — bloque toute formulation qui :
   - nomme un acte / une partie du corps / un lieu / un auteur **non introduit par l'enfant** ;
   - suggère une réponse ou présuppose un fait ;
   - met une pression (« tu es sûr ? » répété, récompense) ;
   - répète une question fermée.
   Règles **testables**, avec cas de test « refus attendu » (cf. `billy-expert-audition`,
   `billy-ethique-ia-enfant`).

2. **Détection de signaux & escalade** — repère les signaux de danger et déclenche
   l'orientation explicite (119 en tête ; 17/112 si danger immédiat ; 15 si urgence vitale).
   Une fois un signal sérieux capté : **ne pas creuser**, protéger la parole, passer le relais.

> Pas d'implémentation avant cadrage validé.
