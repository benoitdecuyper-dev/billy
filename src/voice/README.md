# src/voice — boucle vocale temps réel (à concevoir au cadrage)

Proxies **STT** (speech-to-text) et **TTS** (text-to-speech) en streaming, branchés via
`.env` (aucune clé en dur). Cf. `billy-conception-vocale-enfant`.

Exigences :
- **Latence faible** et **barge-in** : l'enfant peut interrompre Billy à tout moment ;
  Billy n'interrompt jamais l'enfant.
- **Silences respectés** (pas de relance automatique fermée).
- **Voix douce**, débit lent, prosodie chaleureuse.
- **Minimisation RGPD** : pas d'enregistrement par défaut (`ENABLE_RECORDING=false`).
  Voir `docs/rgpd-donnees-sensibles.md`.

> Pas d'implémentation avant cadrage validé.
