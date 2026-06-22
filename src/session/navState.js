/*
 * Continuité « silencieuse » entre séances (BILLY-E15, cf. docs/V2-multi-seances_PO.md).
 *
 * RÈGLE D'ARCHITECTURE CENTRALE : l'état inter-sessions ne contient QUE de la NAVIGATION
 * (à quelle étape on en était, quels jalons franchis, indicateur signal) + des horodatages.
 * JAMAIS de contenu (verbatim, émotion, mots de l'enfant). C'est ce qui résout d'un coup :
 * pas de ré-interrogatoire, pas d'attachement, minimisation RGPD.
 *
 * Verrou anti-réinjection (BILLY-108) : assertNoContent() rejette tout champ non autorisé,
 * et les valeurs ne peuvent être que des IDENTIFIANTS de navigation (jamais du texte libre).
 */

'use strict';

// (Le délai minimum entre séances a été retiré : on peut reprendre quand on veut.)

// Seules ces clés sont autorisées dans l'état persistant. Tout le reste = contenu interdit.
//  - phaseId          : phase NICHD courante (identifiant de navigation)
//  - lastSessionTs    : horodatage de la dernière séance
//  - sessionsCount    : nombre de séances terminées (jamais montré à l'enfant)
//  - signalEmitted    : un signal sérieux est-il déjà apparu ? (verrou post-signal, BILLY-106)
//  - completedPhases  : phases NICHD déjà parcourues (identifiants de navigation)
//  - usedNeutralTopics: sujets neutres d'entraînement P4 déjà utilisés (identifiants seulement)
const ALLOWED_KEYS = new Set([
  'phaseId', 'lastSessionTs', 'sessionsCount',
  'signalEmitted', 'completedPhases', 'usedNeutralTopics',
]);

export function emptyState() {
  return {
    phaseId: null,
    lastSessionTs: 0,
    sessionsCount: 0,
    signalEmitted: false,
    completedPhases: [],
    usedNeutralTopics: [],
  };
}

// Audit/red-team P3 : on ne se contente plus d'un « format » d'identifiant (une phrase courte
// sans espace, ex. « papamatouche », passerait) — on impose une ALLOW-LIST de valeurs connues.
// Les phases sont un ensemble FERMÉ ; les sujets neutres sont des identifiants de catalogue
// (slug court), jamais du texte libre.
const PHASE_IDS = new Set([
  'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7',
  'greeting-brief', 'P3-abridged', 'P4-neutral', 'closure-soft', 'orientation-reinforced',
]);
// Identifiant de sujet neutre = id de CATALOGUE (slug ≤ 24) qui doit comporter un chiffre ou un
// tiret (ex. « t1 », « sujet-neutre-2 ») — pour qu'un mot-phrase concaténé (« papamatouche ») ne
// puisse pas s'y faire passer pour de la navigation. La vraie garantie restera l'allow-list du
// catalogue signé ; ceci est la défense de bas niveau.
const TOPIC_ID_RE = /^[a-z0-9_-]{1,24}$/i;
const isPhaseId = (v) => typeof v === 'string' && PHASE_IDS.has(v);
const isTopicId = (v) => typeof v === 'string' && TOPIC_ID_RE.test(v) && /[0-9-]/.test(v);

/** Vérifie qu'aucune donnée de CONTENU n'a fui dans l'état. Lève si violation. */
export function assertNoContent(state) {
  if (!state || typeof state !== 'object') throw new Error('navState invalide');
  for (const k of Object.keys(state)) {
    if (!ALLOWED_KEYS.has(k)) throw new Error(`navState: clé interdite (contenu ?) « ${k} »`);
  }
  if (state.phaseId !== null && !isPhaseId(state.phaseId))
    throw new Error('navState: phaseId doit être un identifiant de navigation connu, pas du contenu');
  if (typeof state.signalEmitted !== 'boolean')
    throw new Error('navState: signalEmitted doit être un booléen');
  // Audit C3 : les clés numériques DOIVENT être des nombres finis — sinon on pourrait y
  // faire passer du verbatim (une string longue) sous une clé autorisée. Fail-closed.
  for (const f of ['lastSessionTs', 'sessionsCount']) {
    if (typeof state[f] !== 'number' || !Number.isFinite(state[f]))
      throw new Error(`navState: ${f} doit être un nombre (pas du contenu)`);
  }
  if (!Array.isArray(state.completedPhases)) throw new Error('navState: completedPhases doit être une liste d\'identifiants');
  for (const v of state.completedPhases) {
    if (!isPhaseId(v)) throw new Error('navState: completedPhases ne peut contenir que des identifiants de navigation connus, pas du contenu');
  }
  if (!Array.isArray(state.usedNeutralTopics)) throw new Error('navState: usedNeutralTopics doit être une liste d\'identifiants');
  for (const v of state.usedNeutralTopics) {
    if (!isTopicId(v)) throw new Error('navState: usedNeutralTopics ne peut contenir que des identifiants de catalogue, pas du contenu');
  }
  return state;
}

/** Avance la navigation à la phase donnée et l'ajoute aux phases parcourues. */
export function advance(state, phaseId, now) {
  const base = { ...emptyState(), ...state };
  const completedPhases = base.completedPhases.includes(phaseId)
    ? base.completedPhases
    : [...base.completedPhases, phaseId];
  const next = { ...base, phaseId, lastSessionTs: now, completedPhases };
  return assertNoContent(next);
}

/**
 * Positionne l'indicateur « signal sérieux » (BILLY-106). IRRÉVERSIBLE : une fois vrai,
 * il le reste pour toutes les séances suivantes (on ne « rouvre » jamais la porte).
 */
export function markSignal(state) {
  const next = { ...emptyState(), ...state, signalEmitted: true };
  return assertNoContent(next);
}

/** Mémorise l'identifiant d'un sujet neutre P4 déjà utilisé (pour en prendre un autre au retour). */
export function recordNeutralTopic(state, topicId) {
  const base = { ...emptyState(), ...state };
  const usedNeutralTopics = base.usedNeutralTopics.includes(topicId)
    ? base.usedNeutralTopics
    : [...base.usedNeutralTopics, topicId];
  return assertNoContent({ ...base, usedNeutralTopics });
}

/** Termine le parcours : on incrémente le compteur et on remet la navigation à zéro. */
export function complete(state, now) {
  const base = { ...emptyState(), ...state };
  const next = {
    ...base,
    phaseId: null,
    lastSessionTs: now,
    sessionsCount: base.sessionsCount + 1,
    completedPhases: [], // la navigation intra-séance repart de zéro ; les jalons inter-séances vivent ailleurs
  };
  return assertNoContent(next);
}

/**
 * BILLY-105 / BILLY-106 — Planifie la navigation d'une séance de retour.
 *
 * Ne renvoie QUE des descripteurs de navigation (modes, identifiants). Le CONTENU réel
 * (formulations) vit dans le répertoire signé, indexé par ces descripteurs — jamais ici.
 *
 *  - 1ʳᵉ séance              → parcours V1 complet.
 *  - signal déjà émis        → mode post-signal : accueil bref + P3 abrégé + clôture douce
 *                              + orientation renforcée. P5 (ouverture) VERROUILLÉE.
 *  - séance de retour simple → accueil bref + P3 abrégé + P4 sur un sujet neutre DIFFÉRENT
 *                              + P5 identique, neutre, sans référence au passé.
 *
 * @param {object} state              état inter-sessions persisté
 * @param {Array<string|number>} availableNeutralTopicIds ids de sujets neutres du répertoire
 */
export function planReturnSession(state, availableNeutralTopicIds = []) {
  const s = { ...emptyState(), ...(state || {}) };
  assertNoContent(s);

  if (s.sessionsCount === 0) {
    return { mode: 'first', steps: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'], openingLocked: false, neutralTopicId: null };
  }

  if (s.signalEmitted) {
    // Verrou post-signal : on ne rouvre jamais P5.
    return { mode: 'post-signal', steps: ['greeting-brief', 'P3-abridged', 'closure-soft', 'orientation-reinforced'], openingLocked: true, neutralTopicId: null };
  }

  // Séance de retour standard : choisir un sujet neutre encore JAMAIS utilisé.
  // Red-team P4 : si tous les sujets ont déjà servi, on SAUTE P4 (on ne rejoue jamais un sujet
  // déjà ancré) plutôt que de retomber sur le premier de la liste.
  const used = new Set(s.usedNeutralTopics);
  const fresh = availableNeutralTopicIds.find((id) => !used.has(id));
  if (fresh == null) {
    return { mode: 'return', steps: ['greeting-brief', 'P3-abridged', 'P5'], openingLocked: false, neutralTopicId: null };
  }
  return { mode: 'return', steps: ['greeting-brief', 'P3-abridged', 'P4-neutral', 'P5'], openingLocked: false, neutralTopicId: fresh };
}
