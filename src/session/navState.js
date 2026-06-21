/*
 * Continuité « silencieuse » entre séances (BILLY-E15, cf. docs/V2-multi-seances_PO.md).
 *
 * RÈGLE D'ARCHITECTURE CENTRALE : l'état inter-sessions ne contient QUE de la NAVIGATION
 * (à quelle étape on en était) + des horodatages. JAMAIS de contenu (verbatim, émotion,
 * mots de l'enfant). C'est ce qui résout d'un coup : pas de ré-interrogatoire, pas
 * d'attachement, minimisation RGPD.
 *
 * Verrou anti-réinjection (BILLY-108) : assertNoContent() rejette tout champ non autorisé.
 */

'use strict';

// (Le délai minimum entre séances a été retiré : on peut reprendre quand on veut.)

// Seules ces clés sont autorisées dans l'état persistant. Tout le reste = contenu interdit.
const ALLOWED_KEYS = new Set(['phaseId', 'lastSessionTs', 'sessionsCount']);

export function emptyState() {
  return { phaseId: null, lastSessionTs: 0, sessionsCount: 0 };
}

/** Vérifie qu'aucune donnée de CONTENU n'a fui dans l'état. Lève si violation. */
export function assertNoContent(state) {
  if (!state || typeof state !== 'object') throw new Error('navState invalide');
  for (const k of Object.keys(state)) {
    if (!ALLOWED_KEYS.has(k)) throw new Error(`navState: clé interdite (contenu ?) « ${k} »`);
  }
  if (state.phaseId !== null && typeof state.phaseId !== 'string' && typeof state.phaseId !== 'number')
    throw new Error('navState: phaseId doit être un identifiant de navigation, pas du contenu');
  return state;
}

/** Avance la navigation à la phase donnée (identifiant de navigation uniquement). */
export function advance(state, phaseId, now) {
  const next = { ...emptyState(), ...state, phaseId, lastSessionTs: now };
  return assertNoContent(next);
}

/** Termine le parcours : on incrémente le compteur et on remet la navigation à zéro. */
export function complete(state, now) {
  const next = { phaseId: null, lastSessionTs: now, sessionsCount: (state?.sessionsCount || 0) + 1 };
  return assertNoContent(next);
}
