/*
 * BILLY-111 — Métadonnées de séances (pour l'écran « séances » de l'espace parent).
 * Réf. docs/V2-multi-seances_PO.md §4.1 : on ne conserve QUE des métadonnées de navigation
 * (n° de séance, horodatages, durée, indicateur signal, phases parcourues). JAMAIS de contenu :
 * pas de verbatim, pas d'émotion, pas de mots de l'enfant. Fail-closed (clé inconnue = rejet).
 *
 * Ce module est destiné à être chiffré au repos via secureStore (AES-256).
 */

'use strict';

// Seuls ces champs sont autorisés par entrée. Tout le reste = contenu potentiel => rejet.
const ENTRY_KEYS = new Set(['n', 'date', 'debut', 'fin', 'duree', 'signal', 'phases']);

// Une métadonnée texte est COURTE par nature (date/heure/durée) — borne anti-contrebande de contenu.
const isShort = (s) => typeof s === 'string' && s.length <= 40;
const isNavId = (v) =>
  (typeof v === 'number' && Number.isFinite(v)) ||
  (typeof v === 'string' && v.length > 0 && v.length <= 32 && !/\s/.test(v));

/** Vérifie qu'une liste de métadonnées ne contient aucune donnée de contenu. Lève sinon. */
export function assertSessionMetaList(list) {
  if (!Array.isArray(list)) throw new Error('sessionMeta: une liste est attendue');
  for (const e of list) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) throw new Error('sessionMeta: entrée invalide');
    for (const k of Object.keys(e)) {
      if (!ENTRY_KEYS.has(k)) throw new Error(`sessionMeta: champ interdit « ${k} » (contenu ?)`);
    }
    if (typeof e.n !== 'number' || !Number.isFinite(e.n)) throw new Error('sessionMeta: n (numéro de séance) requis');
    if (typeof e.signal !== 'boolean') throw new Error('sessionMeta: signal doit être un booléen');
    for (const f of ['date', 'debut', 'fin', 'duree']) {
      if (e[f] !== undefined && !isShort(e[f])) throw new Error(`sessionMeta: ${f} = métadonnée courte uniquement`);
    }
    if (e.phases !== undefined) {
      if (!Array.isArray(e.phases)) throw new Error('sessionMeta: phases doit être une liste');
      for (const p of e.phases) if (!isNavId(p)) throw new Error('sessionMeta: phases = identifiants de navigation, pas du contenu');
    }
  }
  return list;
}

/** Ajoute une séance à la liste (numérotée automatiquement, nettoyée des champs interdits). */
export function addSessionMeta(list, entry = {}) {
  const base = Array.isArray(list) ? list : [];
  const clean = {
    n: base.length + 1,
    date: entry.date,
    debut: entry.debut,
    fin: entry.fin,
    duree: entry.duree,
    signal: !!entry.signal,
    phases: Array.isArray(entry.phases) ? entry.phases.map(String) : [],
  };
  const next = [...base, clean];
  return assertSessionMetaList(next);
}
