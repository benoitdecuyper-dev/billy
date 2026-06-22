/*
 * src/conversation/selector.js — SÉLECTEUR de répliques (hybride LLM, Option A).
 *
 * Principe de sûreté (cf. docs/V2-llm-selecteur.md) :
 *   Le LLM ne GÉNÈRE jamais le texte prononcé. Il CHOISIT, parmi un menu fini de répliques
 *   pré-validées (script-billy.json), soit un `id`, soit une invitation reprenant un MOT de
 *   l'enfant (cued-invitation). Son espace de sortie est donc :
 *        { répliques du répertoire }  ∪  { invitation(mot dit par l'enfant) }
 *   et TOUTE sortie repasse par la couche sûreté AVANT d'être renvoyée :
 *     - réplique du répertoire  -> audit()            (lint 12+ règles ; garanti PASS par les tests)
 *     - cued-invitation         -> evaluate()         (allow-list : exception cued, slot ∈ lexique, non-tabou)
 *   Fail-closed : tout doute / hors-menu / BLOCK -> repli sur une invitation ouverte.
 *   Sur tout SIGNAL (détresse/révélation/danger), on n'exécute PAS un choix libre : on impose
 *   réassurance + clôture + 119 (le LLM ne pilote pas la révélation — cf. cadrage Option A).
 *
 * Sans LLM (pas de clé) : repli déterministe (reprend le mot de l'enfant, sinon invitation ouverte).
 */

'use strict';

import { audit, evaluate, canon } from '../safety/antiSuggestion.js';

const DEFAULT_OPEN = ['Et après ?', "Dis-m'en plus.", 'Raconte-moi.', "Prends ton temps. Je t'écoute."];
const DEFAULT_REASSURE = "Tu as bien fait de m'en parler. Tu n'as rien fait de mal.";
const SIGNALS = new Set(['distress', 'disclosure', 'danger']);
const STOP = new Set(['les', 'des', 'une', 'mon', 'ton', 'son', 'mes', 'tes', 'ses', 'avec', 'pour', 'dans',
  'est', 'sont', 'que', 'qui', 'quoi', 'moi', 'toi', 'cette', 'aussi', 'tres', 'bien', 'fait', 'faire',
  'jour', 'hier', 'matin', 'soir', 'apres', 'quand', 'comme', 'puis', 'alors', 'beaucoup', 'petit', 'grand']);

function cfg(script) { return (script && script.selecteur) || {}; }
function openFallbacks(script) { const o = cfg(script).repli_invitations_ouvertes; return Array.isArray(o) && o.length ? o : DEFAULT_OPEN; }
function reassurance(script) { return cfg(script).reassurance_sur_signal || DEFAULT_REASSURE; }

/* Le menu de la phase courante : la SEULE liste où le LLM peut piocher un `id`. */
function buildMenu(script, phaseId) {
  const phase = (script.phases || []).find((p) => p.id === phaseId);
  if (!phase) return [];
  return (phase.items || [])
    .filter((it) => it.type !== 'reaction') // P6 (révélation) n'est jamais offert au choix libre
    .map((it) => ({
      id: it.id,
      formulation: it.formulation,
      intent: it.intent || it.intention || '',
      type: it.type,
      expectsChild: it.type === 'billy_demande' || it.type === 'relance_ouverte',
    }));
}

/* Mot repris à l'enfant pour une cued-invitation (dernier mot porteur, non-tabou). */
function pickChildWord(utterance) {
  const words = canon(utterance || '').split(' ').filter(Boolean).reverse();
  return words.find((w) => w.length > 3 && !STOP.has(w) && !TABOO_HIT(w)) || null;
}
function TABOO_HIT(w) {
  // un mot dont la forme « recollée » contient un terme tabou ne peut PAS servir de slot
  return evaluate(`Tu as parlé de ${w}. Raconte-moi ça.`, { childLexicon: [w] }).decision !== 'PASS';
}

function cuedText(word) { return `Tu as parlé de ${word}. Raconte-moi ça.`; }

/* Repli déterministe (sans LLM) : reprend le mot de l'enfant si possible, sinon déroule
 * les lignes de la phase dans l'ordre, et signale l'avancement sur la dernière ligne. */
function chooseDeterministic({ menu, childUtterance, childWords, turnInPhase, script, phaseId }) {
  // 1) si l'enfant vient de parler, on reprend son mot (cued) quand c'est possible
  const word = pickChildWord(childUtterance);
  if (word && hasWord(childWords, word)) return { action: 'cued_invitation', cuedWord: word, signal: 'none' };
  const t = turnInPhase || 0;
  // 2) on récite la phase ligne à ligne ; sur la dernière ligne, on propose la phase suivante
  if (t < menu.length) {
    const phases = cfg(script).phases_demo_neutre || [];
    const i = phases.indexOf(phaseId);
    const next = t === menu.length - 1 && i >= 0 && i + 1 < phases.length ? phases[i + 1] : null;
    return { action: 'say', phraseId: menu[t].id, nextPhase: next, signal: 'none' };
  }
  // 3) phase épuisée (ex. récit qui s'éternise) : invitation ouverte
  const open = openFallbacks(script);
  return { action: 'open', openText: open[t % open.length], signal: 'none' };
}

function hasWord(childWords, w) {
  const c = canon(w);
  if (!childWords) return false;
  if (typeof childWords.has === 'function') return childWords.has(c);
  if (Array.isArray(childWords)) return childWords.map(canon).includes(c);
  return false;
}

/* Construit le prompt destiné au LLM-sélecteur (il ne voit que des `id` + `intent`). */
function buildPrompt({ script, phaseId, menu, history, childUtterance }) {
  const phase = (script.phases || []).find((p) => p.id === phaseId) || {};
  const menuTxt = menu.map((m) => `- ${m.id} (${m.type}) : ${m.intent}`).join('\n');
  const hist = (history || []).slice(-6).map((t) => `${t.acteur} : ${t.texte}`).join('\n') || '(début)';
  const system =
    "Tu es le SÉLECTEUR de répliques de Billy, un personnage qui parle à un enfant de 2-5 ans " +
    "selon le protocole NICHD (entretien non-suggestif). Tu ne RÉDIGES JAMAIS de texte : tu CHOISIS " +
    "uniquement parmi le menu fourni. Règles ABSOLUES : ne jamais nommer un acte, une partie du corps, " +
    "un lieu ou une personne ; jamais de question fermée/orientée ; jamais insister ni promettre le secret. " +
    "Choisis la réplique la plus naturelle et la moins directive pour faire avancer l'échange en douceur. " +
    "Pour rebondir sur ce que l'enfant vient de dire, préfère action='cued_invitation' avec UN mot EXACT " +
    "déjà prononcé par l'enfant. Si l'enfant exprime une détresse, révèle quelque chose de grave, parle de " +
    "danger, de douleur, de peur d'une personne, ou d'un secret 'à ne pas dire' : mets signal en conséquence " +
    "(la suite est gérée hors de toi). Quand la phase a atteint son but, propose nextPhase. Réponds via l'outil 'choisir'.";
  const user =
    `Phase courante : ${phaseId} — ${phase.titre || ''}\nObjectif : ${phase.objectif || ''}\n\n` +
    `Derniers échanges :\n${hist}\n\n` +
    `Ce que l'enfant vient de dire : ${childUtterance ? '"' + childUtterance + '"' : '(rien / silence)'}\n\n` +
    `MENU (choisis un id, ou cued_invitation avec un mot de l'enfant) :\n${menuTxt}\n\n` +
    `Phases possibles ensuite : ${(cfg(script).phases_demo_neutre || []).join(', ')}`;
  return { system, user };
}

/* Valide + résout une décision en un texte SÛR. Fail-closed. */
function finalize(decision, { script, menu, childWords, childUtterance }) {
  const open = openFallbacks(script);
  const fallback = (i = 0) => ({ text: open[i % open.length], expectsChild: true, signal: 'none', nextPhase: null, source: 'fallback' });
  try {
    const d = decision || {};
    const signal = SIGNALS.has(d.signal) ? d.signal : 'none';

    // 1) SIGNAL → séquence imposée : réassurance, on clôt, on oriente (le LLM ne pilote pas)
    if (signal !== 'none') {
      const text = reassurance(script);
      if (audit(text, { childLexicon: childWords }).decision !== 'PASS') return { ...fallback(), signal, nextPhase: 'P7', done: true };
      return { text, expectsChild: false, signal, nextPhase: 'P7', done: true, source: 'signal' };
    }

    const nextPhase = typeof d.nextPhase === 'string' && d.nextPhase ? d.nextPhase : null;

    // 2) cued-invitation : un mot EXACT de l'enfant, validé par l'allow-list (exception cued)
    if (d.action === 'cued_invitation') {
      const word = canon(d.cuedWord || '');
      if (word && hasWord(childWords, word)) {
        const text = cuedText(word);
        if (evaluate(text, { childLexicon: childWords }).decision === 'PASS') return { text, expectsChild: true, signal, nextPhase, source: 'cued' };
      }
      return { ...fallback(), nextPhase };
    }

    // 3) repli sur invitation ouverte explicite
    if (d.action === 'open' && typeof d.openText === 'string' && open.map(canon).includes(canon(d.openText))) {
      if (audit(d.openText, { childLexicon: childWords }).decision === 'PASS') return { text: d.openText, expectsChild: true, signal, nextPhase, source: 'open' };
      return { ...fallback(), nextPhase };
    }

    // 4) say : un id du menu, et SEULEMENT du menu (sinon fail-closed)
    if (d.action === 'say') {
      const item = menu.find((m) => m.id === d.phraseId);
      if (item && audit(item.formulation, { childLexicon: childWords, lastChildUtterance: childUtterance }).decision === 'PASS') {
        return { text: item.formulation, expectsChild: !!item.expectsChild, signal, nextPhase, source: 'repertoire' };
      }
      return { ...fallback(), nextPhase };
    }

    return { ...fallback(), nextPhase };
  } catch {
    return fallback();
  }
}

/*
 * Point d'entrée. llmFn(promptPayload) -> décision structurée | null.
 * Sans llmFn (ou si elle renvoie null/erreur), repli déterministe. Le résultat est TOUJOURS
 * un texte déjà validé par la couche sûreté.
 */
async function chooseNext({ script, phaseId, history = [], childUtterance = '', childWords, turnInPhase = 0, llmFn = null }) {
  const menu = buildMenu(script, phaseId);
  let decision = null;
  if (llmFn) {
    try { decision = await llmFn(buildPrompt({ script, phaseId, menu, history, childUtterance })); }
    catch { decision = null; }
  }
  if (!decision || typeof decision !== 'object') {
    decision = chooseDeterministic({ menu, childUtterance, childWords, turnInPhase, script, phaseId });
  }
  return finalize(decision, { script, menu, childWords, childUtterance });
}

export { chooseNext, buildMenu, buildPrompt, finalize, chooseDeterministic, pickChildWord, cuedText };
