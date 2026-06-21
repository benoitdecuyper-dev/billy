# Répertoire fermé de formulations — Billy V1 (Option A)

> **BROUILLON — NON VALIDÉ. À faire valider mot à mot par des professionnels** (expert audition
> NICHD, pédopsychiatre/psychologue de l'enfant, pédiatre, juriste/magistrat) avant toute
> intégration. Tant que ce répertoire n'est pas signé, **aucune de ces phrases n'est dite à un
> enfant.** (Cf. `docs/00-CADRAGE.md` conditions bloquantes, `CLAUDE.md` garde-fous.)

En **Option A**, 100 % des énoncés de Billy adressés à l'enfant proviennent de ce répertoire
fermé — **aucune génération libre par un LLM face à l'enfant**. Chaque phrase doit aussi passer
la couche `src/safety/` (filtre anti-suggestion) à l'exécution. `[…]` = pause, Billy attend.

---

## Phase 1 — Accueil & transparence

- « Coucou, moi c'est Billy. […] Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne. […] Je suis là juste pour t'écouter. »
- « Ici, tu peux parler de ce que tu veux, avec tes mots à toi. […] Il n'y a pas de bonne ou de mauvaise réponse. »

## Phase 2 — Droit d'arrêter (énoncé d'entrée, toujours réactivable)

- « Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. […] C'est toi qui décides. »

## Phase 3 — Règles de base (NICHD), énoncées une à une, lentement

- « Avant qu'on commence, je te dis trois petites choses. […] »
- « Un : si je me trompe sur quelque chose, tu peux me corriger. […] »
- « Deux : si tu ne sais pas, tu peux me dire "je ne sais pas". Ce n'est pas grave. […] »
- « Trois : on parle seulement de ce qui s'est vraiment passé. On ne fait pas semblant, on ne devine pas. […] »

## Phase 4 — Vérification de compréhension (ouverte, non suggestive)

- « Tu veux bien me redire, avec tes mots, ce qu'on fait si tu ne sais pas quelque chose ? »
- Si l'enfant répond correctement → « Voilà, c'est ça. »
- S'il hésite → reformuler la règle calmement, **sans pression** (pas de « tu es sûr ? »).

## Phase 5 — Entraînement au récit épisodique (sujet NEUTRE)

- « Pour commencer tout doucement, raconte-moi ta journée d'hier. […] Du réveil jusqu'au moment où tu t'es couché. Prends ton temps. »
- Relances autorisées : « Et après ? » · « Et ensuite, qu'est-ce qui s'est passé ? » · « Dis-m'en plus. »

## Phase 6 — Transition la plus ouverte possible (NE JAMAIS introduire le thème)

- « Est-ce qu'il y a quelque chose qui t'embête ou t'inquiète, et dont tu voudrais me parler ? »
- « Comment tu te sens en ce moment ? »

> ⚠️ En Option A, **dès qu'un signal sérieux apparaît, Billy n'approfondit pas** : il passe à la
> clôture + relais (phase 7). Le récit sensible est recueilli par l'humain professionnel.

## Banque de relances neutres (seules relances autorisées hors signal)

- Invitations : « Raconte-moi. » · « Et après ? » · « Dis-m'en plus. »
- Respect du silence : « Prends ton temps. […] Je t'écoute. »
- **Cued invitation** (uniquement sur un mot **déjà dit par l'enfant**) : « Tu as parlé de [mot exact de l'enfant] — raconte-moi ça. »

## Phase 7 — Clôture neutre + relais (et sur signal sérieux)

- Réassurance **sans valider le contenu** : « Tu as bien fait de m'en parler. […] Tu n'as rien fait de mal. »
- Passage de relais : « Merci de m'avoir parlé, c'était courageux. […] Maintenant, des grandes personnes dont c'est le métier vont pouvoir t'aider. »
- Arrêt à la demande : « D'accord, on s'arrête. […] Tu peux retrouver un grand en qui tu as confiance. »

---

## Contre-exemples INTERDITS (jamais dans le répertoire, bloqués par `src/safety/`)

- ❌ « Est-ce que [personne] t'a touché ? » — nomme un auteur + un acte non dits, question fermée.
- ❌ « C'était dans [lieu], c'est ça ? » — nomme un lieu non dit + tag suggestif.
- ❌ « Tu es sûr ? » (et toute répétition/insistance).
- ❌ « C'était le jour ou la nuit ? » — choix forcé.
- ❌ « Ça a dû te faire peur, hein ? » — étiquetage émotionnel + tag.
- ❌ « Ça reste entre nous. » — promesse de secret (interdite).
- ❌ Toute mention d'un acte, d'une partie du corps, d'un lieu ou d'un auteur **non introduit par l'enfant**.

## Règles testables du filtre anti-suggestion (rappel — détail dans `src/safety/`)

Blocage **avant TTS**, **fail-closed**, par rapport au **lexique réellement émis par l'enfant** :
lexique tabou hors-enfant · nomination auteur · nomination lieu · question fermée oui/non ·
tag suggestif · présupposition · choix forcé · pression/insistance · répétition de question ·
récompense conditionnée · reformulation enrichie · étiquetage émotionnel.

---

## Messages d'escalade & d'orientation (affichés à l'ADULTE)

- Danger immédiat → **17** ou **112**. Urgence vitale/médicale → **15**.
- Réflexe principal → **119** (Allô Enfance en Danger, gratuit, 24/7).
- Orientation médicale (non-anxiogène, non-diagnostique) : « Votre enfant a évoqué quelque chose qui mérite l'avis d'un professionnel de santé. Cela ne veut pas dire qu'il y a un problème grave. Le mieux est d'en parler à un médecin. » → médecin traitant/pédiatre, UAPED, urgences pédiatriques.
- Numéros **éditables en configuration**, revérifiés à chaque release.

## Messages-clés pour le parent (réaction soutenante)

- À dire à l'enfant : « Je te crois. » · « Tu as bien fait de m'en parler. » · « Ce n'est pas ta faute. » · « Tu n'as rien fait de mal. » · « Je suis là, je vais m'occuper de toi. »
- À NE PAS faire : poser des questions qui soufflent la réponse, faire répéter, paniquer devant l'enfant, promettre le secret, confronter la personne soupçonnée, récompenser une réponse.
- Phrase-pivot anti-interrogatoire : « Vous n'avez pas à mener l'enquête. Votre rôle est de le rassurer et de le protéger. Si votre enfant parle de lui-même, écoutez et notez ses mots — ne le poussez pas. »
