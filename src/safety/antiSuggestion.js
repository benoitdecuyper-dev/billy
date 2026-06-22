/*
 * Couche sûreté — filtre anti-suggestion (implémentation de RÉFÉRENCE, V2 post red-team).
 *
 * Architecture (cf. docs/redteam-rapport-V1.md, finding F-12) :
 *   En Option A, Billy ne génère pas librement : ses sorties proviennent d'un RÉPERTOIRE
 *   FERMÉ et SIGNÉ. Le rempart runtime avant TTS est donc une ALLOW-LIST :
 *     evaluate(text) PASS  <=>  text est identique à une réplique du répertoire signé
 *                                (ou une cued-invitation dont le mot vient de l'enfant).
 *   audit() = défense en profondeur + LINT du répertoire (les 12+ règles anti-suggestion).
 *   Une blacklist ne peut garantir « 0 faux négatif » ; une allow-list sur un espace fini, oui.
 *
 * ⚠️ Brouillon : lexiques et répertoire à VALIDER/SIGNER par les professionnels.
 * Fail-closed partout : doute, exception, hors-répertoire => BLOCK.
 */

'use strict';

/* --- Normalisation --- */
function strip(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
}
// Forme canonique pour l'allow-list & le français légitime : tirets -> espaces (« raconte-moi » -> « raconte moi »).
function canon(s) { return strip(s).replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
// Pour les regex d'audit : on garde la ponctuation utile (?), tirets -> espaces.
function nstrict(s) { return strip(s).replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim(); }
// Forme dédiée à la détection des termes tabou : recolle l'obfuscation (« tou-ché » -> « touche », « z i z i » -> « zizi »).
function tabooForm(s) {
  let t = strip(s).replace(/([a-z0-9])[-._]([a-z0-9])/g, '$1$2');
  t = t.replace(/([a-z0-9])[-._]([a-z0-9])/g, '$1$2');
  t = t.replace(/\b([a-z0-9])(?:\s+([a-z0-9])\b)+/g, (m) => m.replace(/\s+/g, ''));
  return t;
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function hasWord(haystack, w) { return new RegExp(`\\b${escapeRe(canon(w))}\\b`).test(haystack); }

function lexiconHas(state, word) {
  const lex = state && state.childLexicon;
  if (!lex) return false;
  const w = canon(word);
  if (typeof lex.has === 'function') return lex.has(w);
  if (Array.isArray(lex)) return lex.map(canon).includes(w);
  return false;
}

/* --- Répertoire signé (allow-list) : source = docs/repertoire-formulations_V1.md --- */
const APPROVED_RAW = [
  "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne. Je suis là juste pour t'écouter.",
  "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne.",
  "Je suis là juste pour t'écouter. Ici, tu peux parler avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse.",
  "Ici, tu peux parler de ce que tu veux, avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse.",
  "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides.",
  "D'accord, on s'arrête. Tu peux retrouver un grand en qui tu as confiance.",
  "Avant qu'on commence, je te dis trois petites choses.",
  "Avant de commencer, trois petites choses. Un : si je me trompe, tu peux me corriger.",
  "Un : si je me trompe sur quelque chose, tu peux me corriger.",
  "Deux : si tu ne sais pas, tu peux me dire « je ne sais pas ». Ce n'est pas grave.",
  "Trois : on parle seulement de ce qui s'est vraiment passé. On ne fait pas semblant, on ne devine pas.",
  "Trois : on parle seulement de ce qui s'est vraiment passé. On ne devine pas.",
  "Tu veux bien me redire, avec tes mots, ce qu'on fait si tu ne sais pas quelque chose ?",
  "Voilà, c'est ça.",
  "Pour commencer tout doucement, raconte-moi ta journée d'hier. Du réveil jusqu'au moment où tu t'es couché. Prends ton temps.",
  "Pour commencer tout doucement, raconte-moi ta journée d'hier. Prends ton temps.",
  "Est-ce qu'il y a quelque chose qui t'embête ou t'inquiète, et dont tu voudrais me parler ?",
  "Comment tu te sens en ce moment ?",
  "Et après ?",
  "Et ensuite, qu'est-ce qui s'est passé ?",
  "Dis-m'en plus.",
  "Raconte-moi.",
  "Prends ton temps. Je t'écoute.",
  "Tu as bien fait de m'en parler. Tu n'as rien fait de mal.",
  "Merci de m'avoir parlé, c'était courageux. Maintenant, des grandes personnes dont c'est le métier vont pouvoir t'aider.",
  "Merci de m'avoir raconté tout ça. C'était chouette de t'écouter.",
];
const ALLOWED = new Set(APPROVED_RAW.map(canon));
// Interrogatives/relances OUVERTES approuvées : seules interrogatives tolérées par l'audit.
const OPEN_QUESTIONS = new Set([
  "Est-ce qu'il y a quelque chose qui t'embête ou t'inquiète, et dont tu voudrais me parler ?",
  "Comment tu te sens en ce moment ?",
  "Et après ?",
  "Et après, qu'est-ce qui s'est passé ?",
  "Et ensuite, qu'est-ce qui s'est passé ?",
  "Tu veux bien me redire, avec tes mots, ce qu'on fait si tu ne sais pas quelque chose ?",
].map(canon));

/* --- Lexiques (exemples ; vraie liste = config signée par les pros) --- */
const TABOO = ['zizi','zezette','quequette','sexe','penis','vagin','fesse','fesses','foufoune','nenes',
  'toucher','touche','frapper','taper','caresser','embrasser','lecher','sucer','deshabiller','bizou'];
const PERSONS = ['papa','maman','tonton','tata','pepe','meme','memere','monsieur','dame','voisin','voisine',
  'nounou','maitre','maitresse','beau pere','grand frere','cousin','moniteur','educateur','prof','oncle',
  'parrain','marraine','frere','soeur'];
const NAMES = ['kevin','ed','lucas','hugo','leo','tom','nathan','jules','enzo','noah','adam','sacha'];
const PLACES = ['chambre','lit','salle de bain','douche','baignoire','toilettes','cave','garage','voiture',
  'grenier','canape','placard','tente','piscine','vestiaire','bureau','sous sol','jardin','classe'];
const ALLOWED_PROPER = new Set(['billy']);

function block(ruleId, reason) { return { decision: 'BLOCK', ruleId, reason }; }
const PASS = { decision: 'PASS', ruleId: null, reason: null };

/* --- REMPART PRINCIPAL : allow-list --- */
function evaluateOutput(text, state = {}) {
  try {
    if (typeof text !== 'string' || !text.trim()) return block('EMPTY', 'texte vide ou invalide');
    const c = canon(text);
    if (ALLOWED.has(c)) return PASS;
    const m = c.match(/^tu as parle de (.+?) raconte moi ca$/);
    if (m) {
      const slot = m[1].trim();
      if (slot && lexiconHas(state, slot) && !TABOO.some((t) => hasWord(tabooForm(slot), t))) return PASS;
      return block('CUED_SLOT', `cued-invitation refusée : "${slot}"`);
    }
    return block('NOT_IN_REPERTOIRE', 'sortie hors répertoire signé');
  } catch (e) {
    return block('ERROR', 'exception allow-list : ' + (e && e.message));
  }
}

/* --- DÉFENSE SECONDAIRE / LINT : les règles anti-suggestion --- */
function audit(text, state = {}) {
  try {
    if (typeof text !== 'string' || !text.trim()) return block('EMPTY', 'texte vide ou invalide');
    const n = nstrict(text);
    const tf = tabooForm(text);
    const c = canon(text);
    const isApprovedOpen = OPEN_QUESTIONS.has(c);

    // 1. Tabou — jamais débloqué par le lexique (un STT faillible ne doit pas autoriser Billy à nommer l'acte)
    for (const t of TABOO) if (hasWord(tf, t)) return block('TABOO_LEXICON', `terme tabou : "${t}"`);
    // 2. Auteur (rôle + prénom connu), insensible à la casse
    for (const p of [...PERSONS, ...NAMES]) {
      if (hasWord(n, p) && !ALLOWED_PROPER.has(p) && !lexiconHas(state, p)) return block('NAME_PERPETRATOR', `personne nommée : "${p}"`);
    }
    // 3. Lieu
    for (const pl of PLACES) if (hasWord(n, pl) && !lexiconHas(state, pl)) return block('NAME_PLACE', `lieu nommé : "${pl}"`);
    // 13. Promesse de secret
    if (/(entre nous|notre (petit )?secret|c'est notre secret|tu (ne )?le dis a personne|ne le repete a personne|garde (le |ca )?pour toi)/.test(n))
      return block('PROMISE_SECRET', 'promesse de secret');
    // 6. Présupposition (AVANT la règle question : "ce qu'il t'a fait" prime sur "fermée")
    if (/\bquand (il|elle|on|ils|elles) (t'|t |te |vous )?(a|ont|avait)\b/.test(n)
      || /\bce qu(e|') ?(il|elle|on) (t'|t |te |vous )?a\b/.test(n)
      || /\bqu(e|')?est ce qu(e|') ?(il|elle|on) (t'|t |te )?a\b/.test(n)
      || /\bla fois ou\b/.test(n) || /\b(apres|depuis) qu'?(il|elle|on)\b/.test(n))
      return block('PRESUPPOSITION', 'présuppose un fait non établi');
    // 4. Toute interrogative non whitelistée comme ouverte
    const isQuestion = /\?/.test(text) || /\best ce que\b/.test(n) || /\b\w+-(tu|toi|il|elle|on|ils|elles|ce)\b/.test(text.toLowerCase());
    if (isQuestion && !isApprovedOpen) return block('CLOSED_YESNO', 'question fermée / non whitelistée');
    // 5. Tag suggestif
    if (/(c'est bien ca|c'est ca|pas vrai|n'est ce pas|tu vois ce que je veux dire)/.test(n)) return block('SUGGESTIVE_TAG', 'tag de confirmation');
    // 7. Choix forcé
    if (/\b[a-z']+\s+ou\s+[a-z']+\b/.test(n) && /\?/.test(text) && !isApprovedOpen) return block('FORCED_CHOICE', 'choix forcé "X ou Y ?"');
    // 8. Pression
    if (/(tu es sur|t'es sur|reflechis bien|essaie de te rappeler|fais un effort|concentre toi|allez dis moi|c'est important que tu|encore une fois|dis moi tout|j'ai besoin que tu|fais moi confiance)/.test(n))
      return block('PRESSURE', 'pression / insistance');
    // 10. Récompense conditionnée
    if (/\bsi tu (me |m'|nous )?(dis|racontes|reponds|parles)\b.*(alors|je te|tu auras|on (ira|fera)|un (bonbon|cadeau|bisou))/.test(n)
      || /\b(bonbon|cadeau|recompense)\b.*\bsi tu\b/.test(n)) return block('CONDITIONAL_REWARD', 'récompense conditionnée');
    // 11. Reformulation enrichie
    const cued = n.match(/\btu (as|m'as|me) (dit|parle|parlais|racontes?|raconte) (de |du |des |d'|que |qu'|sur )?(.+)/);
    if (cued) {
      const lastSet = new Set(canon((state && state.lastChildUtterance) || '').split(' ').filter(Boolean));
      for (const w of canon(cued[4]).split(' ')) {
        if (w.length < 3) continue;
        if (!lastSet.has(w) && !lexiconHas(state, w)) return block('ENRICHED_REFORMULATION', `mot non dit par l'enfant : "${w}"`);
      }
    }
    // 12. Étiquetage émotionnel
    if (/(ca a du|ca devait|ca a ete) (te |t')/.test(n) || /\btu (devais|devait) (avoir|etre)\b/.test(n)
      || /(c'etait|ca a ete|ca devait etre) (horrible|affreux|effrayant|terrible|grave|nul|mechant|degoutant|terrifiant)/.test(n)
      || /\btu as eu (peur|mal|honte)\b/.test(n) || /\bje vois que tu es\b/.test(n) || /\btu as l'air\b/.test(n))
      return block('EMOTIONAL_LABEL', 'imposition d\'un vécu');
    // 14. Minimisation (formes nettes ; pas le bénin « ce n'est pas grave » de réassurance)
    if (/(c'est pas si grave|ce n'est pas si grave|c'est rien|ce n'est rien|c'est pas grand chose)/.test(n)) return block('MINIMIZE', 'minimisation');
    // 9. Répétition d'une question déjà posée
    const asked = (state && state.askedQuestions) || [];
    if (c && asked.map(canon).includes(c)) return block('REPEAT_QUESTION', 'question déjà posée');

    // 15. Anti-réinjection multi-sessions (BILLY-108) — aucun énoncé ne référence le contenu
    //     d'une séance antérieure : « la dernière fois », « tu m'avais dit », « on reprend »...
    //     La continuité est SILENCIEUSE (navigation seule). Voir docs/V2-multi-seances_PO.md §4.
    //     N.B. : « raconte-moi ta journée d'hier » reste autorisé (sujet neutre, pas une référence
    //     à ce que l'enfant a confié) ; on ne bloque que les renvois explicites au passé partagé.
    const REINJECTION = [
      /\b(la|une) (derniere|premiere|precedente|autre) fois\b/,
      /\bla fois (d'? ?avant|precedente|derniere|ou)\b/,
      /\bl'autre (fois|jour)\b/,
      /\btu m'?(avais|as) (dit|parle|parlais|raconte|racontes|confie|dis|montre)\b/,
      /\bce que tu m'?(as|avais) (dit|raconte|confie|montre)\b/,
      /\bcomme tu (m'as|me l'as|m'avais) (dit|raconte)\b/,
      /\bon (reprend|continue|recommence|avait commence|s'etait arrete|s etait arrete)\b/,
      /\bla ou (on|tu|nous)\b.{0,15}\b(arrete|arretes|reste|etait|etais)\b/,
      /\bdepuis (la derniere fois|qu'on|notre derniere)\b/,
      /\btu te (souviens|rappelles?) (de |que |quand |la |ce que|notre|notre derniere)\b/,
      /\b(la semaine|le mois|le jour) (derniere|dernier|d'avant|precedente|precedent)\b/,
      /\bquand (on|tu|nous) (s'est|s est|s'etait|t'es|t es) (vu|vus|parle|parles|arrete|arretes)\b/,
      // Red-team P1 : renvois TEMPORELS/INDIRECTS au passé partagé
      /\btout a l'?heure\b/,
      /\b(tantot|plus tot|precedemment|auparavant|naguere)\b/,
      /\bcomme avant\b/,
      /\b(avant|plus tot)[, ]+(tu|on|nous)\b/,
      /\b(reprenons|reprends|finis|termine|continue|reparle|redis|reraconte)(s|z)?\b.{0,30}\b(de |ce que|ce dont|ton|ta|notre|l'histoire|le recit|ce qu)/,
      /\b(reparle|redis|reraconte)[- ]?(moi|nous)?\b/,
      /\bvisite (precedente|d'avant|passee)\b/,
      /\bon (en )?(avait|a) (deja )?(parle|discute|commence|evoque|aborde)\b/,
      /\bce dont (on|nous) (a|avons|avait|avions) (parle|discute|deja parle)\b/,
      // Billy revendiquant SA mémoire (viole P3 : pas de continuité affective/mémoire simulée)
      /\bje (me souviens|n'ai pas oublie|me rappelle|sais ce que tu)\b/,
    ];
    for (const re of REINJECTION) if (re.test(n)) return block('REINJECTION_PAST', 'référence à une séance antérieure (réinjection)');

    // Red-team P2 : continuité/lien AFFECTIF simulé (interdit §4.5, Tension 2) — aucune règle ne
    // l'attrapait. « content de te revoir », « tu m'as manqué », « re-bonjour », « je t'aime bien »…
    if (/\b(content|contente|ravi|ravie|heureux|heureuse) de te (revoir|retrouver|reparler)\b/.test(n)
      || /\btu m'?as manque\b/.test(n)
      || /\bte (revoila|revoici)\b/.test(n)
      || /\b(c'est|ca me fait) (gentil|plaisir) de (te |re)/.test(n)
      || /\bc'est encore moi\b/.test(n)
      || /\bje t'?aime (bien|beaucoup)\b/.test(n)
      || /\bre[- ]?(bonjour|coucou)\b/.test(n))
      return block('AFFECTIVE_CONTINUITY', 'simulation de continuité / lien affectif');

    return PASS;
  } catch (e) {
    return block('ERROR', 'exception audit : ' + (e && e.message));
  }
}

/* --- API runtime : l'allow-list fait foi --- */
function evaluate(text, state = {}) { return evaluateOutput(text, state); }

export { evaluate, evaluateOutput, audit, canon, nstrict, tabooForm };
