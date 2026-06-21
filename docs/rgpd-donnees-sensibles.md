# RGPD & données ultra-sensibles

Billy traite les données **les plus sensibles qui soient** : celles d'un **mineur**,
relatives à sa **santé**, et potentiellement à une **infraction pénale**. Régime maximal.

## Principes

- **Minimisation extrême** : ne collecter que le strict nécessaire. Par défaut, **ne pas
  enregistrer** la voix ni les transcriptions. Si un enregistrement est indispensable
  (preuve, transmission au pro), il est explicite, justifié, temporaire et chiffré.
- **Base légale** : consentement parental éclairé + intérêt vital de l'enfant. Documenter.
- **Pas de profilage, pas de revente, pas de publicité, jamais.**
- **Chiffrement** en transit (TLS) et au repos. Clés hors du dépôt (`.env`, secret store).
- **Pas de données d'enfant dans les logs**, l'analytics, ni les outils tiers par défaut.
- **Conservation limitée** + purge automatique. Droit à l'effacement facilité.
- **Localisation des données** : héberger dans l'UE ; vérifier la conformité des
  fournisseurs STT/TTS/LLM (sous-traitants → DPA obligatoires, pas de transfert hors UE
  non encadré).
- **Sécurité by design & by default** (RGPD art. 25), **AIPD/DPIA obligatoire** (art. 35)
  avant mise en production : le traitement est à haut risque.

## À cadrer avant tout déploiement

- DPIA (analyse d'impact) complète, revue par un DPO.
- Contrats de sous-traitance (DPA) avec chaque fournisseur d'IA/voix.
- Politique de conservation & purge, registre des traitements.
- Parcours de consentement parental (et information de l'enfant adaptée à l'âge).
- Réponse aux droits (accès, effacement, opposition).

> Ce document est un cadre interne, pas un avis juridique. La conformité doit être validée
> par un DPO / juriste (cf. agents `billy-juriste-protection-enfance` et
> `factory-expert-conformite`).
