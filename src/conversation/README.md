# src/conversation — moteur d'entretien (sélecteur hybride)

Implémente le déroulé NICHD (mise en confiance → règles → récit neutre → … → clôture) via un
**sélecteur de répliques** : un LLM **choisit** parmi un répertoire fermé pré-validé, il ne
**génère jamais** le texte. Voir `docs/V2-llm-selecteur.md` pour l'architecture et l'argument de
sécurité complet.

- `selector.js` — `chooseNext()` : construit le menu de la phase, demande un choix (LLM injecté),
  **valide** et résout en un texte sûr (`finalize`, fail-closed). Repli déterministe sans LLM.
- `llm.js` — appel Anthropic côté serveur (tool_use forcé, température 0, timeout). Sans clé → `null`.
- `selector.test.js` — fail-closed prouvé (id halluciné, mot hors lexique/tabou, signal, JSON cassé).

Contraintes (cf. `billy-expert-audition`, `billy-pedopsychologue`) :
- Sortie **uniquement** = réplique du répertoire **ou** invitation reprenant un mot de l'enfant.
- Toute sortie repasse par `src/safety/` (`audit` pour le répertoire, `evaluate` pour la cued) **avant** la voix.
- Sur tout signal de détresse/révélation/danger : réassurance imposée + clôture + 119 (le LLM ne pilote pas).

> Le périmètre reste Option A : le LLM est un aiguilleur sur un espace clos, pas un générateur libre.
> La validation pro du répertoire et de la **politique de sélection** reste un gate ouvert.
