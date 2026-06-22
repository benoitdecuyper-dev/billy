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

// Un identifiant de navigation = chaîne courte ou nombre, jamais une phrase (pas d'espace, borné).
function isNavId(v) {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v !== 'string') return false;
  return v.length > 0 && v.length <= 32 && !/\s/.test(v);
}

/** Vérifie qu'aucune donnée de CONTENU n'a fui dans l'état. Lève si violation. */
export function assertNoContent(state) {
  if (!state || typeof state !== 'object') throw new Error('navState invalide');
  for (const k of Object.keys(state)) {
    if (!ALLOWED_KEYS.has(k)) throw new Error(`navState: clé interdite (contenu ?) « ${k} »`);
  }
  if (state.phaseId !== null && !isNavId(state.phaseId))
    throw new Error('navState: phaseId doit être un identifiant de navigation, pas du contenu');
  if (typeof state.signalEmitted !== 'boolean')
    throw new Error('navState: signalEmitted doit être un booléen');
  for (const key of ['completedPhases', 'usedNeutralTopics']) {
    const arr = state[key];
    if (!Array.isArray(arr)) throw new Error(`navState: ${key} doit être une liste d'identifiants`);
    for (const v of arr) {
      if (!isNavId(v))
        throw new Error(`navState: ${key} ne peut contenir que des identifiants de navigation, pas du contenu`);
    }
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

  // Séance de retour standard : choisir un sujet neutre encore jamais utilisé.
  const used = new Set(s.usedNeutralTopics);
  const fresh = availableNeutralTopicIds.find((id) => !used.has(id));
  const neutralTopicId = fresh != null ? fresh : (availableNeutralTopicIds[0] ?? null);
  return { mode: 'return', steps: ['greeting-brief', 'P3-abridged', 'P4-neutral', 'P5'], openingLocked: false, neutralTopicId };
}
