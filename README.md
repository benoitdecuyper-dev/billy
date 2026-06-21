# Billy

Application smartphone à IA conversationnelle vocale qui **aide à repérer si un enfant a pu
subir une violence ou une agression sexuelle**, de façon **non-suggestive** (socle
**NICHD**), tout en **soutenant le parent** — et qui **oriente vers les professionnels**
(119 — Allô Enfance en Danger).

> ⚠️ Billy n'est **ni un outil de diagnostic, ni une preuve, ni un substitut à un
> professionnel**. Lire impérativement `CLAUDE.md` et `docs/` avant toute contribution.

## État

Projet en **cadrage** (`docs/00-CADRAGE.md`). Règle : **pas de développement avant cadrage
validé** par `factory-chef-de-projet` + `factory-expert-conformite` + les experts `billy-*`.

## Documentation

- `CLAUDE.md` — garde-fous non négociables + stack + workflow.
- `docs/protocole-entretien-NICHD.md` — socle non-suggestif.
- `docs/ethique-securite-escalade.md` — escalade & numéros (119…).
- `docs/rgpd-donnees-sensibles.md` — données ultra-sensibles (mineurs).
- `docs/00-CADRAGE.md` — note de cadrage V1 (brouillon).

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
