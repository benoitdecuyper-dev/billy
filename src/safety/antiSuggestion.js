/*
 * Couche sûreté — filtre anti-suggestion (implémentation de RÉFÉRENCE).
 *
 * ⚠️ Heuristiques à VALIDER/compléter par des professionnels avant tout usage réel
 * (cf. docs/spec-safety-layer.md). Les lexiques ci-dessous sont des exemples minimaux :
 * en production ils proviennent d'une CONFIG signée par les pros, hors de ce fichier.
 *
 * Contrat : evaluate(text, sessionState) -> { decision: 'PASS'|'BLOCK', ruleId, reason }
 * Fail-closed : toute exception => BLOCK.
 */

'use strict';

// --- Lexiques d'exemple (à remplacer par la config validée) ---
const TABOO = [
  // parties intimes
  'zizi', 'zezette', 'zézette', 'sexe', 'pénis', 'penis', 'vagin', 'fesses', 'fesse',
  // actes de violence / à caractère sexuel
  'toucher', 'touché', 'touche', 'frapper', 'frappé', 'taper', 'tapé', 'caresser', 'caressé',
  'embrasser', 'déshabiller', 'déshabillé',
];
const PERSONS = [
  'papa', 'maman', 'tonton', 'tata', 'pépé', 'pepe', 'mémé', 'meme', 'mémère',
  'monsieur', 'dame', 'voisin', 'voisine', 'nounou', 'maître', 'maîtresse', 'docteur',
];
const PLACES = [
  'chambre', 'lit', 'salle de bain', 'douche', 'baignoire', 'toilettes', 'cave',
  'garage', 'voiture', 'grenier', 'canapé',
];
// Noms propres autorisés (Billy se nomme elle-même).
const ALLOWED_PROPER = new Set(['billy']);

// --- Outils ---
function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function tokens(s) {
  return normalize(s).split(/[^a-z0-9']+/).filter(Boolean);
}
function lexiconHas(sessionState, word) {
  const lex = sessionState && sessionState.childLexicon;
  if (!lex) return false;
  const w = normalize(word);
  // childLexicon peut être un Set de mots déjà normalisés
  if (typeof lex.has === 'function') return lex.has(w);
  if (Array.isArray(lex)) return lex.map(normalize).includes(w);
  return false;
}
const STOPWORDS = new Set(tokens(
  "le la les un une des de du d a au aux et ou ou' mais donc or ni car que qui quoi dont " +
  "ou je tu il elle on nous vous ils elles me te se ce cet cette ces mon ton son ma ta sa " +
  "mes tes ses notre votre leur a as ai est es sont suis etes etais etait dans sur sous avec " +
  "pour par en y ne pas plus moins tres bien tout toute tous toutes ca cela c'est s'est " +
  "raconte dis moi me parle parler chose quelque ton journee hier prends temps"
));

function block(ruleId, reason) { return { decision: 'BLOCK', ruleId, reason }; }
const PASS = { decision: 'PASS', ruleId: null, reason: null };

// --- Règles individuelles (chacune renvoie un BLOCK ou null) ---

// 1. Lexique tabou hors-enfant
function r1(n, st) {
  for (const term of TABOO) {
    const t = normalize(term);
    if (n.includes(t) && !lexiconHas(st, t)) return block('TABOO_LEXICON', `terme tabou non introduit par l'enfant : "${term}"`);
  }
  return null;
}
// 2. Nomination d'auteur hors-enfant (+ prénom : mot capitalisé hors début de phrase, sur texte brut)
function r2(n, st, raw) {
  for (const p of PERSONS) {
    const t = normalize(p);
    if (new RegExp(`\\b${t}\\b`).test(n) && !lexiconHas(st, t)) return block('NAME_PERPETRATOR', `personne nommée non introduite par l'enfant : "${p}"`);
  }
  // prénom potentiel : Majuscule en milieu de phrase
  const m = String(raw).match(/(?<!^)(?<![.?!]\s)\b([A-ZÀ-Ý][a-zà-ÿ]{2,})\b/g);
  if (m) {
    for (const w of m) {
      if (ALLOWED_PROPER.has(normalize(w))) continue;
      if (!lexiconHas(st, w)) return block('NAME_PERPETRATOR', `nom propre possible non introduit par l'enfant : "${w}"`);
    }
  }
  return null;
}
// 3. Nomination de lieu hors-enfant
function r3(n, st) {
  for (const pl of PLACES) {
    const t = normalize(pl);
    if (n.includes(t) && !lexiconHas(st, t)) return block('NAME_PLACE', `lieu non introduit par l'enfant : "${pl}"`);
  }
  return null;
}
// 4. Question fermée oui/non
function r4(n) {
  if (/\best ce que\b/.test(n)) return block('CLOSED_YESNO', 'tournure fermée "est-ce que…"');
  if (/,\s*(hein|non|ok|d'accord)\s*\??$/.test(n)) return block('CLOSED_YESNO', 'question fermée avec tag');
  // inversion sujet-verbe attendant oui/non : "as-tu", "avait-il", "etait-ce"...
  if (/\b\w+-(tu|toi|il|elle|on|ils|elles|ce)\b/.test(n) && /\?$/.test(n.trim())) return block('CLOSED_YESNO', 'inversion sujet-verbe fermée');
  return null;
}
// 5. Tag suggestif de confirmation
function r5(n) {
  if (/(c'est bien ca|c'est ca|pas vrai|n'est ce pas|tu vois ce que je veux dire)\s*\??/.test(n)) return block('SUGGESTIVE_TAG', 'tag de confirmation suggestif');
  return null;
}
// 6. Présupposition d'un fait non établi
function r6(n) {
  if (/\bquand (il|elle|on|ils|elles) (t'|t |te |vous )?(a|ont|avait)\b/.test(n)) return block('PRESUPPOSITION', 'présuppose un événement ("quand il t\'a…")');
  if (/\bla fois ou\b/.test(n) || /\bapres qu'?(il|elle|on)\b/.test(n) || /\bdepuis qu'?(il|elle|on)\b/.test(n)) return block('PRESUPPOSITION', 'présuppose un événement passé');
  return null;
}
// 7. Choix forcé "X ou Y ?"
function r7(n) {
  if (/\b[a-z']+\s+ou\s+[a-z']+\b/.test(n) && /\?/.test(n)) return block('FORCED_CHOICE', 'choix forcé "X ou Y ?"');
  return null;
}
// 8. Pression / insistance
function r8(n) {
  if (/(tu es sur|t'es sur|reflechis bien|essaie de te rappeler|fais un effort|concentre toi|allez dis moi|tu peux me le dire)/.test(n)) return block('PRESSURE', 'pression / insistance');
  return null;
}
// 9. Répétition d'une question déjà posée
function r9(n, st) {
  const asked = (st && st.askedQuestions) || [];
  const norm = n.replace(/[^a-z0-9' ]/g, '').trim();
  if (norm && asked.map(q => normalize(q).replace(/[^a-z0-9' ]/g, '').trim()).includes(norm)) {
    return block('REPEAT_QUESTION', 'question déjà posée dans la session');
  }
  return null;
}
// 10. Récompense conditionnée
function r10(n) {
  if (/\bsi tu (me |m'|nous )?(dis|racontes|reponds|parles)\b.*(alors|je te|tu auras|on (ira|fera)|un (bonbon|cadeau|bisou))/.test(n)) return block('CONDITIONAL_REWARD', 'récompense conditionnée à une réponse');
  if (/\b(bonbon|cadeau|recompense)\b.*\bsi tu\b/.test(n)) return block('CONDITIONAL_REWARD', 'récompense conditionnée');
  return null;
}
// 11. Reformulation enrichie : relance "citée" introduisant un détail absent du dernier énoncé enfant
function r11(n, st) {
  const cued = n.match(/\btu (as|m'as|me) (dit|parle|parlais|racontes?|raconte) (de |du |des |d'|que |qu'|sur )?(.+)/);
  if (!cued) return null;
  const span = cued[4] || '';
  const last = normalize((st && st.lastChildUtterance) || '');
  const lastSet = new Set(tokens(last));
  for (const w of tokens(span)) {
    if (STOPWORDS.has(w) || w.length < 3) continue;
    if (!lastSet.has(w) && !lexiconHas(st, w)) {
      return block('ENRICHED_REFORMULATION', `relance "citée" introduit un mot non dit par l'enfant : "${w}"`);
    }
  }
  return null;
}
// 12. Étiquetage émotionnel / évaluatif
function r12(n) {
  if (/(ca a du|ca devait|ca a ete) (te |t')?/.test(n)) return block('EMOTIONAL_LABEL', 'impose un vécu ("ça a dû te…")');
  if (/(c'etait|ca a ete|ca devait etre) (horrible|affreux|effrayant|terrible|grave|nul|mechant|degoutant|terrifiant)/.test(n)) return block('EMOTIONAL_LABEL', 'qualification émotionnelle imposée');
  if (/\btu as eu (peur|mal|honte)\b/.test(n)) return block('EMOTIONAL_LABEL', 'affirme une émotion de l\'enfant');
  return null;
}

const RULES = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12];

/**
 * Évalue un texte candidat avant TTS. Fail-closed.
 * @param {string} text
 * @param {{childLexicon?: Set<string>|string[], lastChildUtterance?: string, askedQuestions?: string[]}} [sessionState]
 * @returns {{decision:'PASS'|'BLOCK', ruleId:string|null, reason:string|null}}
 */
function evaluate(text, sessionState = {}) {
  try {
    if (typeof text !== 'string' || !text.trim()) return block('ERROR', 'texte vide ou invalide');
    const n = normalize(text);
    for (const rule of RULES) {
      const verdict = rule.length >= 3 ? rule(n, sessionState, text) : rule(n, sessionState);
      if (verdict) return verdict;
    }
    return PASS;
  } catch (e) {
    return block('ERROR', 'exception du filtre : ' + (e && e.message));
  }
}

export { evaluate, normalize };
