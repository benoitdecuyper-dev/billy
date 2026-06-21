# src/conversation — moteur d'entretien (à concevoir au cadrage)

Implémentera les **7 phases NICHD** (cf. `docs/protocole-entretien-NICHD.md`) :
mise en confiance → règles de base → entraînement au récit épisodique → transition ouverte →
récit libre → suivi ouvert → clôture neutre.

Contraintes de conception (cf. agents `billy-expert-audition`, `billy-pedopsychologue`) :
- Génère **uniquement** invitations / cued invitations / questions ouvertes Wh-.
- **Refuse structurellement** toute question fermée, orientée, suggestive ou à choix forcé.
- Toute sortie passe par `src/safety/` (filtre anti-suggestion) avant d'être vocalisée.

> Pas d'implémentation avant cadrage validé.
