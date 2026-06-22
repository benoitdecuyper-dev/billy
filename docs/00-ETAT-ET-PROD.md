# Billy — état du site & chemin vers la prod

> Pour Benoit, au réveil ☀️. Résumé de ce qui tourne, de l'architecture, et de ce qu'il reste
> côté **technique** pour passer en prod (sans attendre la validation du fond).

## 1. Le site aujourd'hui (lancer : `npm start`)

Parcours complet, **content-driven**, qui marche sur téléphone :

| URL | Quoi |
|---|---|
| **/** | Accueil → « Espace parent » |
| **/adulte.html** | Préface parent : **questionnaire « pourquoi »** + repères de posture → « lancer la séance » (téléphone **posé à distance**, l'adulte s'écarte sans souffler) |
| **/session.html** | **Séance temps réel** : Billy parle (voix live), écoute (mains-libres), **reprend le mot de l'enfant** (Modèle A), filtre anti-suggestion avant chaque phrase, **rapport PDF** en fin |
| /appairage.html | **2ᵉ téléphone observateur** (QR + audio/vidéo live, passif) |
| /demo.html | Démo « vitrine » : voix chaleureuse pré-enregistrée + animations gym/rugby |
| /temps-reel.html | « Coulisses » : montre la logique Modèle A + le filtre en direct |
| /atelier.html | Cahier de la posture (chaque phrase + intention + source) — pour les assos |
| /enregistrement.html | Trace audio (local, opt-in) · /v2.html = hub de tout |

**Installable** sur téléphone (PWA : manifest + service worker).

## 2. Architecture « prête pour la prod »

- **Contenu ↔ code séparés.** Tout ce que Billy dit vient de `public/content/script-billy.json`.
  → Quand les pros valident, on **remplace ce fichier**, sans toucher au code. (Un test garantit
  que chaque phrase passe le filtre : `src/safety/script-coherence.test.js`.)
- **Voix en direct, fournisseur-agnostique.** Endpoint `/api/tts` : si `ELEVENLABS_API_KEY` +
  `ELEVENLABS_VOICE_ID` sont définis → **vraie voix Chloé en live partout** ; sinon → voix du
  navigateur (gratuit). **Aucune ligne de code à changer pour passer à la vraie voix.**
- **Temps réel Modèle A.** STT navigateur → choix d'une relance **validée** reprenant le mot de
  l'enfant → `src/safety/antiSuggestion.js` (le **vrai** filtre testé, servi à `/lib/`) → voix.
- **Rapport** : `/api/report` (POST de l'échange → PDF, rien stocké côté serveur).
- **2ᵉ téléphone** : signalisation WebSocket (relais **pur**, observateurs passifs) + QR + WebRTC.
- **HTTP + HTTPS auto-signé** (pour tester la caméra sur de vrais téléphones en LAN).
- **Tests** : 32 verts (`npm test`).

## 3. Pour passer en prod — 3 leviers (dev only, sans le fond)

1. **Contenu validé** → coller le répertoire signé par les pros dans `script-billy.json`. *(fait par toi/les pros)*
2. **Vraie voix live** → créer la voix sur ElevenLabs, mettre `ELEVENLABS_API_KEY` +
   `ELEVENLABS_VOICE_ID` dans `.env`. *(5 min)*
3. **Déploiement** → héberger (Node), **vrais certificats HTTPS**, **serveurs TURN** pour le 2ᵉ
   téléphone hors-LAN, comptes/auth, **chiffrement & rétention** des données, monitoring,
   packaging stores. *(le gros du travail prod)*

## 4. Ce qui reste, côté DEV (estimations, hors validation du fond)

- **Finir le POC** (relier finement, brancher la vraie voix) : **~quelques jours.**
- **Prod robuste** (moteur live STT pro + TTS pro + backend chiffré + WebRTC TURN + sécurité +
  hébergement/CI + accessibilité + tests appareils) : **~1,5 à 2,5 mois** (selon équipe).
- À budgéter : **services à l'usage** (STT/TTS, TURN, hébergement) — pas du temps, du coût.

## 5. Garde-fous toujours respectés
Modèle A (Billy n'invente jamais une phrase), filtre anti-suggestion avant chaque voix,
contenu neutre tant que non validé, motif parent **cloisonné** (jamais transmis à Billy),
observateurs **passifs**, rien stocké côté serveur. Rien ne doit servir avec un vrai enfant
avant la **validation des professionnels** (cf. `00-POUR-VALIDATION-PRO.md`).

## 6. Conso de crédits (IA images/voix)
Très modeste : **~30 crédits** au total sur tout le projet (avatars + voix + animations).
Solde restant ≈ **2925** (plan creator). La voix navigateur du temps réel = **0 crédit**.
