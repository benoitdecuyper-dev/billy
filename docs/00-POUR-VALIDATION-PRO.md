# Billy — dossier pour validation professionnelle

> Document d'entrée à remettre aux **professionnels** (pédopsychiatrie petite enfance,
> psychologue de l'enfant, expert audition/NICHD, juriste/magistrat, médecin, DPO).
> **Tout le contenu du projet est un BROUILLON non validé** : il a été construit à partir de
> sources reconnues (ci-dessous), mais **rien ne doit être utilisé avec un enfant avant votre
> validation.**

## 1. Ce qu'est Billy (en 5 lignes)

Application smartphone à IA vocale, incarnée par une mascotte (un écureuil, « Billy »), qui
**aide à repérer si un jeune enfant a pu subir une violence/agression** — **sans jamais mener
d'interrogatoire** — et qui **oriente vers les professionnels**. Cible principale : **2-5 ans**.
Posture = **Option A** : mise en confiance + ouverture neutre + repérage de signaux + orientation.
**Billy n'investigue pas, ne qualifie pas, ne conclut pas, ne désigne aucun auteur.**

## 2. Ce qu'on vous demande de valider (par priorité)

1. **La posture et les formulations** que Billy peut dire à l'enfant
   → `public/content/script-billy.json` (rendu lisible sur la page **Atelier**), `repertoire-formulations_V1.md`,
   `posture-reference_V1..V4.md`, `techniques-interview-2-5.md`.
2. **La faisabilité et la sécurité de l'approche 2-5 ans** (le point le plus sensible)
   → `cible-2-5-ans.md`, `techniques-interview-2-5.md`, `ux-2-5.md`.
3. **La couche anti-suggestion** (les règles qui empêchent toute question suggestive)
   → `spec-safety-layer.md`, code `src/safety/`, rapport de red-team `redteam-rapport-V1.md`.
4. **L'escalade et le rapport** (signaux → orientation ; compte rendu transmissible)
   → `ethique-securite-escalade.md`, `rapport-de-seance.md` (exemples PDF dans `docs/`).
5. **La conformité données** (mineur + santé + pénal)
   → `rgpd-donnees-sensibles.md` (DPIA à mener).

## 3. Garde-fous (volontairement non négociables)

Pas de **diagnostic**, pas de **preuve**, pas d'**interrogatoire**, pas de **question fermée/
suggestive**, jamais **nommer** un acte/un lieu/un auteur, jamais **promettre le secret**,
**seuil d'orientation très bas**, **119** systématique, **recueil du récit laissé aux pros**.
Détails : `CLAUDE.md` (7 garde-fous) et `00-CADRAGE.md`.

## 4. Les sources qui fondent la posture

CIIVISE (livret « Mélissa et les autres », rapport 2023) · MIPROF / arretonslesviolences ·
**protegernosenfants.fr** · **Guide parents VSM, Ville de Paris** · **Mémoire Traumatique et
Victimologie (Dr Salmona)** · **CRIAVS** (comportements sexuels par âge) · **NICHD 2021** ·
**Barnahus / PROMISE** · NSPCC / RAINN / Stop It Now / Darkness to Light. *(Sources citées
verbatim dans les `posture-reference_*`.)*

## 5. Carte des documents

**Cadrage & cible** : `00-CADRAGE.md` · `cible-2-5-ans.md` · `CLAUDE.md`
**Posture (référence)** : `posture-reference_V1.md` → `V4.md` · `techniques-interview-2-5.md`
**Script (source unique)** : `public/content/script-billy.json` (vu sur la page Atelier) · `repertoire-formulations_V1.md`
**Sécurité / anti-suggestion** : `spec-safety-layer.md` · `redteam-rapport-V1.md` · `src/safety/`
**Escalade & rapport** : `ethique-securite-escalade.md` · `rapport-de-seance.md` · exemples PDF
**UX** : `ux-2-5.md`
**Conformité** : `rgpd-donnees-sensibles.md`
**V2 (à venir)** : `roadmap-V2.md` · `V2-multi-seances_PO.md`
**Backlog** : `Jira_Billy_backlog.md`

## 6. Voir l'outil (prototype)

Prototype local (démo d'expérience, contenu **neutre**) : lancer `npm start`, puis dans Chrome/Edge —
`http://localhost:3000` (la mascotte + la voix, mains-libres) et `http://localhost:3000/atelier.html`
(le **Cahier de la posture** : chaque phrase de Billy avec intention, justification et source).

> ⚠️ Le prototype illustre la **forme** (voix, mascotte, mains-libres). Le **fond** (chaque mot
> dit à un enfant) est exactement ce que nous vous demandons de **valider et corriger**.
