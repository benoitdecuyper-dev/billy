# Billy

Application smartphone à IA vocale, incarnée par une mascotte (un écureuil), qui **aide à
repérer si un jeune enfant a pu subir une violence ou une agression**, de façon
**strictement non-suggestive** (socle **NICHD**), **sans jamais l'interroger**, et qui
**oriente vers les professionnels** (119 — Allô Enfance en Danger).

**Cible principale : enfants de 2-5 ans** (voix + images, mains-libres — l'appareil est tenu
par l'adulte). Voir `docs/cible-2-5-ans.md`.

> ⚠️ Billy n'est **ni un outil de diagnostic, ni une preuve, ni un substitut à un
> professionnel**. Tout le contenu est **BROUILLON, à valider par des professionnels** :
> commencer par **`docs/00-POUR-VALIDATION-PRO.md`**.

## État

Projet en **cadrage / conception**, **pas de développement applicatif avant validation pro +
DPIA**. Un **prototype d'expérience** (forme : voix + mascotte + mains-libres, contenu neutre)
existe (`npm start` → `http://localhost:3000`, et `/atelier.html` pour le Cahier de la posture).

## Documentation — commencer ici

- **`docs/00-POUR-VALIDATION-PRO.md`** — dossier d'entrée + carte de tous les documents.
- `CLAUDE.md` — 7 garde-fous non négociables.
- `docs/00-CADRAGE.md` — note de cadrage (Option A). `docs/cible-2-5-ans.md` — la cible 2-5.
- `docs/posture-reference_V1..V4.md` + `docs/techniques-interview-2-5.md` — la posture & les questions.
- `docs/ethique-securite-escalade.md` · `docs/rgpd-donnees-sensibles.md` · `docs/rapport-de-seance.md`.

## Équipe d'experts (agents `.claude/agents/billy-*`)

`billy-pedopsychologue` · `billy-expert-audition` · `billy-juriste-protection-enfance` ·
`billy-pediatre` · `billy-ethique-ia-enfant` · `billy-conception-vocale-enfant` ·
`billy-accompagnement-parents`. Les agents `factory-*` et la business team restent
disponibles globalement.

## Démarrage (dev)

```bash
cp .env.example .env   # renseigner les clés
npm install
npm run dev
```

## Stack (V1)

PWA mobile-first + Node/Express. Boucle vocale temps réel STT → moteur (Claude) → TTS.
Voir `CLAUDE.md`.
