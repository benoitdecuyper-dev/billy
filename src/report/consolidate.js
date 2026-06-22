/*
 * BILLY-112 / BILLY-113 — Rapport CONSOLIDÉ multi-sessions.
 * Réf. docs/V2-multi-seances_PO.md §5 (structure & règles d'agrégation).
 *
 * Règles NON négociables :
 *  - Chaque séance = un BLOC séparé et daté. On ne fusionne JAMAIS les verbatim (§5.2).
 *  - Le verbatim d'une séance N n'apparaît que dans le bloc de la séance N (garanti par
 *    construction : chaque bloc ne porte que ses propres tours).
 *  - Le récapitulatif consolidé liste les signaux SESSION PAR SESSION, sans les croiser
 *    ni en tirer une conclusion (§5.2, §5.3).
 *  - Pas de résumé en langage naturel inter-sessions (réservé à une éventuelle V3).
 *  - Périmètre de données strict §4.1 : prénom/âge déclarés, horodatages, n° de session,
 *    phases (navigation), signaux, verbatim. Tout le reste est REFUSÉ (assertReportPerimeter).
 */

'use strict';

const norm = (k) => String(k).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Champs INTERDITS dans un rapport (BILLY-113) — hors périmètre §4.1 du PO multi-sessions :
// vécu émotionnel, données comportementales/analytiques, profilage, synthèse/reformulation
// inter-sessions, score/progression. Leur présence = fuite de données sensibles.
const FORBIDDEN_KEYS = new Set([
  'emotion', 'ressenti', 'humeur', 'comportement', 'hesitation', 'hesitations',
  'vitesse', 'pause', 'pauses', 'tempspause', 'elocution', 'debitparole',
  'preference', 'preferences', 'profil', 'analytics', 'score', 'progression',
  'evolution', 'comparaison', 'synthese', 'resume', 'reformulation', 'interpretation',
]);

// L'objet enfant ne peut porter QUE le prénom et l'âge déclarés (§4.2 : minimisation).
const CHILD_ALLOWED = new Set(['prenom', 'age']);

/**
 * BILLY-113 — Vérifie que la structure du rapport ne contient AUCUNE donnée hors périmètre.
 * Lève une erreur explicite à la première violation. Fail-closed.
 */
export function assertReportPerimeter(node, path = 'rapport') {
  if (node === null || node === undefined) return node;
  if (Array.isArray(node)) {
    node.forEach((v, i) => assertReportPerimeter(v, `${path}[${i}]`));
    return node;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (FORBIDDEN_KEYS.has(norm(k)))
        throw new Error(`rapport: champ hors périmètre RGPD « ${k} » en ${path}`);
    }
    // L'objet « enfant » est verrouillé sur prénom + âge.
    const isChild = path.endsWith('.enfant') || path === 'rapport.enfant';
    if (isChild) {
      for (const k of Object.keys(node)) {
        if (!CHILD_ALLOWED.has(k))
          throw new Error(`rapport: donnée d'identification non autorisée sur l'enfant « ${k} » en ${path}`);
      }
    }
    for (const k of Object.keys(node)) assertReportPerimeter(node[k], `${path}.${k}`);
  }
  return node;
}

/**
 * BILLY-112 — Construit le rapport consolidé à partir d'une liste de séances.
 * Reconstruit chaque bloc avec les SEULS champs autorisés (minimisation par construction :
 * tout champ analytique présent en entrée est écarté, pas seulement signalé).
 *
 * @param {Array} sessions  séances ordonnées (même format que le rapport mono-séance)
 * @returns {object} rapport consolidé conforme au §5.1
 */
export function buildConsolidated(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0)
    throw new Error('rapport consolidé : aucune séance fournie');

  const first = sessions[0];
  if (!first.enfant || !first.enfant.prenom)
    throw new Error('rapport consolidé : enfant (prénom déclaré) manquant');

  const enfant = { prenom: first.enfant.prenom, age: first.enfant.age };

  const blocs = sessions.map((s, i) => ({
    numero: i + 1,
    date: s.date,
    debut: s.debut,
    fin: s.fin,
    duree: s.duree,
    phases: Array.isArray(s.phases) ? s.phases.map(String) : [],
    // verbatim : uniquement heure/acteur/texte — confiné à CE bloc (jamais réinjecté ailleurs).
    tours: (s.tours || []).map((t) => ({ heure: t.heure, acteur: t.acteur, texte: t.texte })),
    signaux: Array.isArray(s.signaux) ? [...s.signaux] : [],
  }));

  // Inventaire factuel des signaux, séance par séance — sans fusion ni croisement.
  const signauxParSession = blocs
    .filter((b) => b.signaux.length > 0)
    .map((b) => ({ session: b.numero, signaux: b.signaux }));
  const totalSignaux = signauxParSession.reduce((n, x) => n + x.signaux.length, 0);

  const consolidated = {
    enfant,
    nombreSessions: blocs.length,
    periode: { debut: blocs[0].date, fin: blocs[blocs.length - 1].date },
    version: first.version,
    sessions: blocs,
    recapitulatif: {
      signauxParSession,
      niveauGlobal: totalSignaux > 0
        ? 'Un ou plusieurs signaux sérieux ont été repérés.'
        : 'Aucun signal de danger repéré sur l\'ensemble des séances.',
      demarche: totalSignaux > 0
        ? 'Par précaution, appelez le 119 (gratuit, confidentiel, 24/7). En cas de danger immédiat : 17 / 112.'
        : 'Aucune action d\'urgence requise au vu de ces échanges. En cas de doute, vous pouvez toujours appeler le 119.',
    },
  };

  // Garde-fou final : on ne renvoie jamais un rapport hors périmètre.
  return assertReportPerimeter(consolidated);
}
