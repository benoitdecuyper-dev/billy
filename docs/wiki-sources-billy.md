# Billy — Les sources et comment elles ont nourri le projet (page wiki)

> Page destinée à l'espace wiki Billy (sous-page de « Billy »). Objet : dire **exactement
> d'où vient chaque chose que Billy fait ou dit**, et **comment chaque source a contribué**
> concrètement (quelle règle, quel écran, quel fichier). Rien dans Billy n'est « inventé » :
> tout est distillé depuis des références reconnues.
> **Statut : compilation de travail, NON validée par des professionnels.** À relire et
> corriger avec les associations et les experts avant tout usage réel.

---

## 1. Le principe : Billy ne dit rien qui ne vienne d'une source

Billy n'est pas un chatbot qui improvise. Chaque formulation qu'il peut prononcer, chaque
règle de sécurité, chaque numéro d'orientation est **tiré d'une source de référence**, puis
passé par une **chaîne de distillation** :

```
Sources de référence
   → posture-reference_V1 → V4  (doctrine de posture, versionnée)
   → repertoire-formulations_V1  (banque fermée de phrases, par phase NICHD)
   → public/content/script-billy.json  (le fichier que l'app lit)
   → allow-list dans src/safety/antiSuggestion.js (miroir runtime)
   → /atelier.html  (chaque phrase affichée avec son intention + sa source)
```

Dans `script-billy.json`, **chaque phrase porte un champ `source`** : la traçabilité est
intégrée au fichier machine. C'est ce qui rend Billy **auditable** : un professionnel peut
remonter de n'importe quelle phrase jusqu'à la référence qui la fonde.

---

## 2. Les sources, famille par famille, et leur apport concret

### A. Protocoles d'audition non-suggestive (le squelette de Billy)

**NICHD — Protocole révisé 2021** *(National Institute of Child Health and Human Development)*
C'est **le socle**. Il a apporté à Billy, directement :
- les **7 phases** d'une séance (accueil/mise en confiance → droit d'arrêter → règles de
  base → entraînement au récit neutre → ouverture neutre → bonnes réactions + arrêt →
  clôture/orientation) — ce sont les phases P1→P7 de `script-billy.json` ;
- la **hiérarchie des questions** (invitations ouvertes > relances sur un mot déjà dit de
  l'enfant > questions ouvertes qui/quoi/où ; **questions fermées/suggestives interdites**) ;
- les **« ground rules »** (« je ne comprends pas », « je ne sais pas / ne devine pas »,
  « corrige-moi », promesse de vérité) et l'**entraînement au récit épisodique** sur un
  événement neutre ;
- la **règle absolue anti-contamination** : ne jamais nommer un acte / une partie du corps /
  un lieu / un auteur que l'enfant n'a pas nommé en premier.
- **→ Où dans Billy :** moteur de phases `src/conversation/`, les 7 phases du répertoire,
  le filtre `src/safety/antiSuggestion.js`, le « Modèle A » (Billy reprend les mots de
  l'enfant, n'invente rien).
- 🔗 <https://www.nichdprotocol.com/the-nichd-protocol/_obj/pdf/28/REVISED_VERSION_2021.pdf>

**Barnahus / PROMISE — European Quality Standards**
Modèle de la « maison des enfants » : **un seul intervenant formé + des observateurs
passifs**, et **entretien unique** (ne pas faire répéter l'enfant).
- **→ Où dans Billy :** le **2ᵉ téléphone observateur strictement passif** (QR + WebRTC,
  lecture seule) ; le principe « entretien unique » → règle « ne pas faire répéter ».
- 🔗 <https://www.barnahus.eu/en/wp-content/uploads/2020/02/PROMISE-Barnahus-Quality-Standards.pdf>

**ABE — Achieving Best Evidence (UK)** : référence complémentaire sur le questionnement
gradué (du plus ouvert au plus directif), cohérente avec NICHD.

---

### B. Institutionnel France (la posture et l'orientation)

**CIIVISE — Livret de formation « Mélissa et les autres » (juin 2023) + Rapport « On vous croit » (2023)**
*(Commission Indépendante sur l'Inceste et les Violences Sexuelles faites aux Enfants)*
Fondement de la **doctrine Option A** (Billy n'enquête pas). Apports verbatim :
- **« Signaler n'est pas enquêter »** — ce n'est ni vérifier les faits, ni amener des
  preuves, ni qualifier ni désigner un auteur. → justifie que Billy **repère et oriente**,
  sans recueillir le récit sensible ;
- les **trois piliers** : croire / rassurer-déculpabiliser / orienter ;
- les listes **à dire / à ne pas dire** à l'enfant (Livret p. 34-35) et les **amorces
  ouvertes non suggestives** (p. 36) ;
- « il faut un mouvement de l'adulte vers l'enfant qui génère de la confiance ».
- **→ Où dans Billy :** le répertoire de **bonnes réactions** (P6 : « je te crois », « ce
  n'est pas ta faute », « tu as bien fait d'en parler »), la liste des **interdits**, les
  questions d'**ouverture** (P5), tout le cadrage Option A, l'orientation 119.
- 🔗 <https://www.ciivise.fr/sites/ciivise/files/2024-10/Livret-de-formation-CIIVISE-juin%202023.pdf>
  · <https://www.ciivise.fr/le-rapport-public-de-2023>

**MIPROF / arretonslesviolences.gouv.fr — « Que faire quand la victime se confie »**
A confirmé les **réflexes** (écouter, ne pas enquêter, noter, orienter) et le **circuit de
signalement**. → consolide la doctrine de posture et le bloc orientation.
🔗 <https://arretonslesviolences.gouv.fr/je-suis-temoin/que-faire-quand-la-victime-se-confie>

**119 — Allô Enfance en Danger / allo119.gouv.fr**
Le **réflexe d'orientation principal** : national, gratuit, confidentiel, 24/7, n'apparaît
sur aucun relevé.
- **→ Où dans Billy :** `docs/ethique-securite-escalade.md`, la section `orientation` de
  `script-billy.json`, la **réassurance + 119 imposée** dès tout signal, l'écran parent.
- 🔗 <https://www.allo119.gouv.fr/>

**protegernosenfants.fr**
A fourni des **verbatim** très opérationnels : phrases exactes à dire, **8 réflexes** (écouter
sans interrompre, **noter les mots exacts**, signaler, ne pas confronter, consulter un
médecin, maintenir la normalité, ne pas promettre le secret, protéger du regard), pièges à
éviter, repères d'éducation par âge, et les **10 signaux d'alerte**.
- **→ Où dans Billy :** le répertoire de réactions, les **10 signaux** → logique de
  détection, le « noter les mots exacts » → **rapport verbatim**, la préface parent.
- 🔗 <https://protegernosenfants.fr/>

**Guide à destination des parents « Violences sexuelles faites aux enfants : prévenir,
repérer, agir » — Ville de Paris (mars 2026)**
A fourni le **tableau « à privilégier / à éviter »** (verbatim, le plus utile du projet),
le principe « **ne pas mener vous-même une enquête** », les **signes par âge** (3-5 ans /
6-12 ans), le **cas institutionnel** (adulte d'une structure mis en cause → informer la
structure + art. 40 CPP), et la consigne « **noter le contexte** ».
- **→ Où dans Billy :** les formulations à éviter/privilégier, les signes par âge pour la
  détection, l'espace parent, la **branche d'escalade institutionnelle**, le rapport.
- 🔗 réf. guide VSM Ville de Paris (mars 2026).

**CN2R — « Accueillir et recueillir la parole de l'enfant »** *(Centre National de
Ressources et de Résilience)* : document de référence de la posture V1.
🔗 <https://cn2r.fr/wp-content/uploads/2024/10/Accueil_recueil_parole_enfant_Cn2r.pdf>

**La Voix de l'Enfant — UAPED** : a ancré les **UAPED** (Unités d'Accueil Pédiatrique
Enfance en Danger) comme **destination de la prise en charge** dans le circuit d'orientation
et le glossaire. 🔗 <https://www.lavoixdelenfant.org/actions/accueil-et-ecoute/>

---

### C. Repères de développement (pour NE PAS sur-alerter)

**CRIAVS Île-de-France — « Les comportements sexuels des enfants et des adolescents »**
A apporté le cadre **développement normal vs préoccupant** : 3 niveaux (découverte / à
surveiller / orienter), le principe « **il n'y a pas de norme** ; un signal est un indice,
pas un diagnostic », et surtout les **critères qui font basculer « normal → alerte** »
(persistance malgré explication, compulsivité, **contrainte**, écart d'âge ≥ 5 ans,
**secret + déni**, mise en danger, auto-blessure…). Précision capitale : l'exploration de
l'**identité de genre / orientation** est **normale** et ne doit PAS être codée en signal.
- **→ Où dans Billy :** la **logique de détection des signaux** (exiger comportement **+**
  au moins un critère modulant, 2 niveaux, **indexée par âge**) → réduit les faux positifs ;
  la rédaction du rapport.
- 🔗 <https://violences-sexuelles.info/dl/VSI-COMPORTEMENT-SEXUELS-ENFANTS.pdf>

---

### D. Clinique du psychotraumatisme

**Dr Muriel Salmona — Mémoire Traumatique et Victimologie** (Guide « Quand on te fait du
mal », 2022 ; article psychotraumatisme enfants, 2015)
Apport décisif et **contre-intuitif** :
- un enfant **gravement traumatisé peut sembler aller bien** (récit froid, dissocié) → il
  faut s'inquiéter **davantage**, pas moins ;
- **l'adulte qui écoute se dissocie aussi** → « tout noter, ne pas rester seul » → renforce
  le **rapport verbatim** ;
- **règle de vocabulaire** : ne jamais nommer l'auteur, **surtout pas par un terme affectif**
  (« ton papa », « ta nounou »…) ;
- « **plus les enfants sont jeunes, plus le traumatisme est important** » ;
- la **liste rouge** des phrases qui aggravent (doute, culpabilisation, minimisation).
- **→ Où dans Billy :** la **règle anti-suggestion sur les termes affectifs** (codée dans
  `antiSuggestion.js`), le **rapport** (ne jamais présenter un récit calme comme rassurant —
  au contraire, le signaler), la **préface parent** (enseigner la dissociation, « tout
  noter », « ne pas rester seul »), la liste des interdits.
- 🔗 <https://www.memoiretraumatique.org/>

---

### E. Sources internationales (apports peu présents côté FR)

**NSPCC (UK), RAINN (US), Stop It Now, Darkness to Light, UNICEF**
- **NSPCC** : « **plusieurs petites conversations** valent mieux qu'un grand entretien » →
  fonde le **modèle multi-séances** (épopée BILLY-E15) ; la révélation est souvent
  **indirecte / par indices** → écouter les **signaux faibles** ; « 4 à 8 % des
  signalements sont faux » → **croire** par défaut.
- **RAINN** : ne pas interpréter le calme comme preuve que rien ne s'est passé (converge
  avec la dissociation de Salmona).
- **UNICEF** : se **mettre à hauteur** de l'enfant.
- **Stop It Now / Darkness to Light** : amorces ouvertes, réassurance, ne pas promettre le
  secret, ne pas enquêter.
- **→ Où dans Billy :** le design **multi-séances V2**, le répertoire de réassurance, la
  règle « surveiller son expression » côté parent, l'écoute des signaux faibles.
- 🔗 NSPCC · RAINN · Stop It Now · Darkness to Light · UNICEF (liens en bas).

---

### F. Cadre légal (l'ossature de l'orientation)

**Code de procédure pénale & Code pénal** : **art. 40 CPP** (signalement au procureur),
**art. 434-1 / 434-3 CP** (non-dénonciation / non-assistance), principe « **l'accord du
mineur n'est pas nécessaire** » et « si les détenteurs de l'autorité parentale sont mis en
cause, **ne pas les en informer** ».
- **→ Où dans Billy :** le circuit d'orientation (CRIP, procureur), la gestion du cas
  « l'adulte qui tient le téléphone peut être l'auteur » (cible 2-5 ans), la branche
  d'escalade institutionnelle.

---

## 3. Tableau de synthèse — quelle source a nourri quoi

| Composant de Billy | Sources principales |
|---|---|
| **7 phases de la séance** | NICHD 2021 |
| **Hiérarchie des questions / invitations ouvertes** | NICHD 2021, CIIVISE |
| **Filtre anti-suggestion** (`src/safety/antiSuggestion.js`) | NICHD (ne jamais nommer), Salmona (termes affectifs) |
| **Répertoire de bonnes réactions** (« je te crois »…) | CIIVISE, protegernosenfants.fr, Guide VSM Paris, international |
| **Doctrine Option A** (repérer + orienter, ne pas enquêter) | CIIVISE (« signaler n'est pas enquêter »), Guide VSM Paris |
| **Détection des signaux** (comportement + critère, par âge) | CRIAVS, Guide VSM Paris, protegernosenfants.fr (10 signaux) |
| **Rapport verbatim** (observations brutes, signaler le calme) | Salmona, protegernosenfants.fr, Guide VSM Paris |
| **Escalade / orientation** (119, CRIP, procureur, UAPED) | 119, CIIVISE, MIPROF, La Voix de l'Enfant, art. 40 CPP |
| **2ᵉ téléphone observateur passif** | Barnahus / PROMISE |
| **Modèle multi-séances (V2)** | NSPCC |
| **Espace / préface parent** (dissociation, ne pas rester seul) | Salmona, protegernosenfants.fr, Guide VSM Paris |
| **Cas institutionnel / adulte tenant le téléphone** | Guide VSM Paris, art. 40 CPP |
| **Cible 2-5 ans (seuil d'orientation très bas)** | NICHD (adaptations), CIIVISE, Salmona, CRIAVS |

---

## 4. Comment les sources ont été appliquées (et leur limite)

Les sources ci-dessus ont été lues, croisées et appliquées **à travers les agents experts
du projet** (`.claude/agents/billy-*` : pédopsychologue, expert audition d'enfant, juriste
protection de l'enfance, pédiatre, éthique de l'IA pour enfants, conception vocale,
accompagnement parents). Ces agents **ne remplacent pas** des professionnels humains.

> ⚠️ **Limite assumée.** Cette page est une **compilation de travail**. Aucune source ne
> vaut **caution professionnelle**, et **aucune phrase n'est dite à un enfant** tant que de
> vrais professionnels (pédopsychiatrie petite enfance, NICHD, juriste/magistrat,
> associations) n'ont pas validé le répertoire. Les passages « entre guillemets » sont des
> verbatim ; le reste est une synthèse susceptible d'erreur.

---

## 5. Liens des sources

- **NICHD 2021** : <https://www.nichdprotocol.com/the-nichd-protocol/_obj/pdf/28/REVISED_VERSION_2021.pdf>
- **Barnahus / PROMISE** : <https://www.barnahus.eu/en/wp-content/uploads/2020/02/PROMISE-Barnahus-Quality-Standards.pdf>
- **CIIVISE** : <https://www.ciivise.fr/sites/ciivise/files/2024-10/Livret-de-formation-CIIVISE-juin%202023.pdf> · <https://www.ciivise.fr/le-rapport-public-de-2023>
- **MIPROF / arretonslesviolences** : <https://arretonslesviolences.gouv.fr/je-suis-temoin/que-faire-quand-la-victime-se-confie>
- **119** : <https://www.allo119.gouv.fr/>
- **protegernosenfants.fr** : <https://protegernosenfants.fr/>
- **CN2R** : <https://cn2r.fr/wp-content/uploads/2024/10/Accueil_recueil_parole_enfant_Cn2r.pdf>
- **La Voix de l'Enfant** : <https://www.lavoixdelenfant.org/actions/accueil-et-ecoute/>
- **CRIAVS Île-de-France** : <https://violences-sexuelles.info/dl/VSI-COMPORTEMENT-SEXUELS-ENFANTS.pdf>
- **Mémoire Traumatique et Victimologie / Dr M. Salmona** : <https://www.memoiretraumatique.org/>
- **NSPCC** : <https://learning.nspcc.org.uk/safeguarding-child-protection/how-to-have-difficult-conversations-with-children>
- **RAINN** : <https://rainn.org/show-up-speak-out-step-in/how-to-talk-with-survivors-of-sexual-violence/>
- **Stop It Now** : <https://www.stopitnow.org/ohc-content/talking-to-children-and-teens>
- **Darkness to Light** : <https://www.d2l.org/fall5steps/>
- **UNICEF** : <https://www.unicef.org/parenting/child-care/9-tips-for-better-communication>
- **Guide parents VSM** — Ville de Paris (mars 2026).

> Voir aussi, côté repo : `docs/posture-reference_V1.md` → `V4.md`,
> `docs/techniques-interview-2-5.md`, `docs/protocole-entretien-NICHD.md`,
> `docs/ethique-securite-escalade.md`.
