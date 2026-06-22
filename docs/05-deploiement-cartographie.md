# Cartographie de déploiement — Billy (as-built / cible)

> Document de référence de l'infrastructure. Convention **identique au parc** (Sporae, Wikifluence) :
> repo GitHub `benoitdecuyper-dev` + `render.yaml` → **Render** (Node, Frankfurt). **Netlify n'est PAS
> utilisé** (hébergeur abandonné dans le parc). Secrets uniquement en variables d'env Render.

## 1. Inventaire des services

| # | Service | Rôle | Référence | État |
|---|---------|------|-----------|------|
| 1 | **GitHub** | Code source | `benoitdecuyper-dev/billy` (**public**) | ✅ |
| 2 | **Render** | Hébergement Node + HTTPS | service `billy` = `srv-d8seiom7r5hc73fdddfg` (free, Frankfurt) → **https://billy-zt3x.onrender.com** | ✅ en prod |
| 3 | **Anthropic** | LLM-sélecteur (`/api/next`) | clé `ANTHROPIC_API_KEY` (env Render) | ⏳ optionnel |
| 4 | **ElevenLabs** | Voix Billy (`/api/tts`) | `ELEVENLABS_*` (env Render) | ⏳ optionnel |

Sans clé Anthropic → Billy tourne en **repli déterministe** (la démo fonctionne). Sans ElevenLabs → **voix navigateur**.

## 2. Application (rappel)

Serveur **Node natif** (`src/server/index.js`) : pages statiques `/public` + API
`POST /api/next` (sélecteur), `POST /api/tts` (voix), `POST /api/report` (PDF), WebSocket `/signal`
(appairage 2ᵉ téléphone). En production, le HTTPS auto-signé est désactivé (`NODE_ENV=production`) :
Render fournit le TLS au edge.

## 3. Variables d'environnement (Render)

| Variable | Secret | Rôle | Valeur |
|----------|:------:|------|--------|
| `NODE_ENV` | non | Mode | `production` |
| `BILLY_LLM_MODEL` | non | Modèle LLM (sélecteur) | `claude-haiku-4-5` |
| `ANTHROPIC_API_KEY` | **oui** | Sélecteur LLM | *(env Render, sync:false)* |
| `ELEVENLABS_API_KEY` | **oui** | Voix | *(env Render, sync:false)* |
| `ELEVENLABS_VOICE_ID` | **oui** | Voix « Chloé » | *(env Render, sync:false)* |
| `PORT` | non | Port | injecté par Render |

## 4. Procédure de déploiement (convention parc)

Service **déjà créé** (2026-06-22) via l'**API Render** (`RENDER_API_KEY`, owner
`tea-d8okctbeo5us73ed342g`). Pour les **mises à jour** : `git push origin main` puis déclencher le
deploy (l'auto-deploy ne part pas toujours seul) :
```
POST https://api.render.com/v1/services/srv-d8seiom7r5hc73fdddfg/deploys   (Bearer $RENDER_API_KEY)
```
Vérifier le statut (`live`) : `GET /v1/services/srv-d8seiom7r5hc73fdddfg/deploys?limit=1`.

**Secrets à ajouter dans le dashboard / via l'API** pour activer les options :
`ANTHROPIC_API_KEY` (active le vrai LLM-sélecteur ; sinon repli déterministe),
`ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` (vraie voix ; sinon voix navigateur).
> Comme Sporae : si le dépôt est ajouté sans webhook GitHub, l'auto-déploiement ne se déclenche
> pas sur `git push` → déclencher le deploy via l'API. (Idéal : autoriser l'app GitHub de Render
> sur le dépôt privé pour récupérer l'auto-déploiement.)

## 5. À retenir

- **Ne jamais déployer Billy sur Netlify** (hébergeur abandonné du parc).
- Secrets jamais committés ; tout en env Render.
- Domaine : `billy.onrender.com` par défaut (custom domain possible plus tard).
