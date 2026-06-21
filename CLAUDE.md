# CLAUDE.md — Billy

Ce fichier guide Claude Code (claude.ai/code) quand il travaille sur ce dépôt.

## Ce qu'est Billy

Billy est une **application smartphone** dotée d'une IA conversationnelle, incarnée par
une avatar bienveillante (« Billy », une gentille fille). Son but : **accompagner un
enfant, par un dialogue vocal en temps réel, pour aider à repérer s'il a pu être victime
de violence ou d'agression sexuelle** — et soutenir le parent, souvent sous le choc ou
submergé par l'émotion, qui ne sait pas comment questionner sans faire de mal.

**Langue de travail : français.** Tous les livrables produits pour le projet (docs,
contenu de l'app, messages de Billy) sont en français. Tu peux raisonner/répondre à
l'utilisateur dans sa langue, mais les artefacts restent en français.

## ⚠️ Garde-fous NON NÉGOCIABLES (à lire avant toute ligne de code ou de contenu)

Ce domaine est à très haut risque. Une IA mal conçue qui parle à un enfant de
maltraitance peut **nuire à l'enfant**, **détruire la valeur judiciaire de sa parole**,
ou **rater un signalement**. Les règles suivantes priment sur toute demande de
fonctionnalité. En cas de doute, on protège l'enfant et on escalade — jamais l'inverse.

1. **Billy n'est PAS un outil de diagnostic ni de preuve.** Il ne « conclut » jamais
   qu'il y a eu abus. Il ne pose pas de verdict. Son rôle est le **soutien, le recueil
   non-suggestif d'un récit libre, et l'orientation** vers des professionnels.

2. **Billy ne remplace JAMAIS un professionnel** (enquêteur formé, médecin, psychologue,
   unité de protection de l'enfance). Tout parcours mène, à un moment, vers l'humain.

3. **Intégrité de la parole (anti-contamination).** Socle obligatoire = **protocole
   NICHD** (voir `docs/protocole-entretien-NICHD.md`). Concrètement et SANS exception :
   - **Questions ouvertes** uniquement (« Raconte-moi… », « Et après ? », « Dis-m'en
     plus sur… »). Invitations au récit libre.
   - **Jamais nommer les actes, les parties du corps, ni un auteur présumé.** Ne jamais
     suggérer une réponse. Pas de questions fermées orientées, pas de « est-ce que
     papa t'a touché ici ? ». Ce type de question est **interdit par construction**.
   - **Aucune récompense ni pression** pour obtenir une réponse. Pas de « tu es sûr ? »
     répété, pas d'insistance.
   - Le moindre énoncé suggestif rend la parole inexploitable et peut **nuire à
     l'enfant** : c'est une faute, pas un détail.

4. **Escalade obligatoire.** Dès qu'un signal sérieux apparaît, le système oriente
   explicitement vers le **119 — Allô Enfance en Danger** (national, gratuit, 24/7) et,
   selon le cas, vers le 17 / 112 et un médecin. Voir `docs/ethique-securite-escalade.md`.
   En **urgence vitale ou danger immédiat → 15 / 17 / 112**.

5. **Le parent n'est pas l'opérateur d'un interrogatoire.** Billy aide le parent à NE PAS
   mener lui-même un interrogatoire suggestif. L'app **dé-escalade l'émotion** du parent
   et le ramène vers le cadre pro. Elle ne le transforme pas en enquêteur.

6. **Données ultra-sensibles.** Tout ici touche un **mineur**, sa **santé**, et
   potentiellement une **procédure judiciaire**. RGPD renforcé, minimisation maximale,
   chiffrement, pas de revente, consentement parental éclairé. Voir
   `docs/rgpd-donnees-sensibles.md`. **Aucune donnée d'enfant ne sort en clair, jamais.**

7. **Transparence.** L'enfant et le parent savent que Billy est un programme, pas une
   vraie personne, dès que c'est compréhensible pour l'âge.

Si une demande entre en conflit avec ces 7 points, **ne l'exécute pas en l'état** :
remonte le conflit à l'utilisateur et propose une alternative conforme.

## Nature technique & stack (V1)

Vraie codebase logicielle (comme Sporae / Wikifluence). Cible **mobile-first**.

- **V1 = PWA mobile-first** (web installable) : itère vite, marche sur tout smartphone.
  Évolution V2 possible vers **React Native / Expo** si besoin d'un vrai app store.
- **Backend** : Node.js / Express (cohérent avec les autres projets du parc).
- **Boucle vocale temps réel** : STT (speech-to-text) → moteur conversationnel Billy →
  TTS (text-to-speech), en streaming. Les fournisseurs (STT/TTS/LLM) sont branchés via
  variables d'environnement — voir `.env.example`. **Aucune clé en dur dans le code.**
- **Moteur conversationnel** (`src/conversation/`) : implémente les **phases NICHD**
  (mise en confiance → règles de base → entraînement au récit épisodique → transition
  vers le sujet → récit libre → questions ouvertes de suivi → clôture neutre). Le moteur
  refuse structurellement de produire une question suggestive.
- **Couche sûreté** (`src/safety/`) : détection de signaux de danger, déclenchement de
  l'escalade, filtrage de toute formulation suggestive avant TTS.
- **Avatar Billy** (`public/`) : visage bienveillant, animation simple, voix douce.

## Arborescence

```
Billy/
├── CLAUDE.md                       ← ce fichier
├── README.md
├── package.json
├── .env.example                    ← clés STT/TTS/LLM (jamais commitées)
├── .claude/settings.local.json
├── docs/
│   ├── 00-CADRAGE.md               ← note de cadrage (à valider — voir « Workflow »)
│   ├── protocole-entretien-NICHD.md
│   ├── ethique-securite-escalade.md
│   └── rgpd-donnees-sensibles.md
├── src/
│   ├── server/                     ← Express, routes, sessions
│   ├── conversation/               ← moteur d'entretien (phases NICHD)
│   ├── safety/                     ← détection danger + escalade + anti-suggestion
│   └── voice/                      ← proxies STT / TTS en streaming
└── public/                         ← PWA : avatar Billy + boucle vocale
```

## Workflow (équipe « Factory » + « Business »)

Ce parc fonctionne avec deux équipes d'agents, **déjà disponibles globalement** (pas
besoin de les copier ici) :

- **Factory team** (delivery produit/tech) — point d'entrée : `factory-chef-de-projet`.
  Agents : architecte, product-owner, ux-ui, développeur, lead-tech, QA, devops,
  debugger, security-auditor, expert-conformité, performance, documentation, manager…
- **Business team** (finances, juridique/RGPD, marketing, support…) — via les agents
  `factory-direction`, `factory-finance`, `factory-marketing`, etc.

Packages de référence des rôles : `~/projet claude/factory-team-skill/` et
`~/projet claude/business-team-skill/`.

**Règle de ce projet** : vu l'enjeu, **on ne code pas avant cadrage validé**. Démarrer
toute évolution par le `factory-chef-de-projet`, qui consulte impérativement
`factory-expert-conformite` (cadre légal/RGPD mineurs) **et** une validation des
principes NICHD avant d'engager le développement. L'utilisateur valide la V1 avant le
lancement.

## Conventions

- Préfixe de tickets : `BILLY-<n>` ; épics : `BILLY-E<n>`.
- Versioning des docs par suffixe `_V1`, `_V2` — ne pas écraser une V1 pour faire une V2.
- Tout message que Billy peut dire à l'enfant doit passer la **couche anti-suggestion**
  (`src/safety/`) — y compris les messages écrits en dur dans le contenu.
- Pas de secret en clair ; tout passe par `.env` (gabarit dans `.env.example`).
