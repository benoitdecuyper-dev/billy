/*
 * Billy — moteur de SÉANCE (architecture prête pour la prod).
 *
 * - PILOTÉ PAR LE CONTENU : lit public/content/script-billy.json (la « source unique »).
 *   → quand les professionnels valideront le contenu, on remplace ce fichier, sans toucher au code.
 * - VOIX EN DIRECT : /api/tts (ElevenLabs si une clé est configurée) ; sinon, voix du navigateur.
 *   → en prod, ajouter ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID = vraie voix Chloé en live partout.
 * - TEMPS RÉEL (Modèle A) : l'enfant parle (STT navigateur) → Billy choisit une relance VALIDÉE
 *   en reprenant le MOT de l'enfant (jamais inventer) → filtre anti-suggestion AVANT la voix.
 * - 2-5 ans : mains-libres (aucun bouton enfant), pas de sous-titres, Billy ne coupe jamais.
 * - Démo NEUTRE : on ne joue que les phases non-sensibles (accueil, règles, récit neutre, clôture).
 */
import { audit } from '/lib/antiSuggestion.js';

(() => {
  'use strict';

  const NEUTRAL_PHASES = ['P1', 'P2', 'P3', 'P4', 'P7']; // P5 (transition) / P6 (révélation) = exclus de la démo neutre
  const OPEN_RELANCES = ['Et après ?', "Dis-m'en plus."];
  const SILENCE_TXT = "Prends ton temps. Je t'écoute.";
  const STOP = new Set(['les', 'des', 'une', 'mon', 'ton', 'son', 'mes', 'tes', 'ses', 'avec', 'pour', 'dans',
    'est', 'sont', 'que', 'qui', 'quoi', 'moi', 'toi', 'cette', 'aussi', 'tres', 'bien', 'fait', 'faire',
    'jour', 'hier', 'matin', 'soir', 'apres', 'quand', 'comme', 'puis', 'alors', 'beaucoup', 'petit', 'grand']);
  const TABOU = ['zizi', 'zezette', 'sexe', 'penis', 'vagin', 'fesse', 'fesses', 'toucher', 'touche', 'frapper', 'taper'];
  const END_MS = 2800, NUDGE_MS = 12000, NO_STT_WAIT = 5000, MAX_TURNS = 2;

  const app = document.querySelector('.app');
  const billy = document.getElementById('billy');
  const start = document.getElementById('start');
  const startBtn = document.getElementById('startBtn');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  let script = null, frVoice = null, flap = null, childWords = new Set(), relIdx = 0, started = false;

  const setState = (s) => { app.dataset.state = s; };
  const canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

  if ('speechSynthesis' in window) { const pv = () => { const v = speechSynthesis.getVoices().filter((x) => /^fr/i.test(x.lang)); frVoice = v.find((x) => /google|natural|naturel/i.test(x.name)) || v[0] || null; }; pv(); speechSynthesis.onvoiceschanged = pv; }

  function startFlap() { stopFlap(); flap = setInterval(() => billy.classList.toggle('open'), 140); }
  function stopFlap() { if (flap) { clearInterval(flap); flap = null; } billy.classList.remove('open'); }

  function playUrl(url) { return new Promise((res) => { const a = new Audio(url); a.onended = res; a.onerror = res; a.play().catch(res); }); }
  function speakBrowser(text) {
    return new Promise((res) => {
      if (!('speechSynthesis' in window)) { res(); return; }
      const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = 0.9; u.pitch = 1.06;
      u.onend = res; u.onerror = res; speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
  }

  // Tout ce que Billy dit passe le filtre AVANT la voix (fail-closed).
  async function speak(text) {
    setState('speaking');
    const v = audit(text, { childLexicon: childWords });
    if (v.decision === 'BLOCK') text = OPEN_RELANCES[0]; // garde-fou : repli sur invitation ouverte
    startFlap();
    try {
      const r = await fetch('/api/tts?text=' + encodeURIComponent(text));
      if (r.ok) { const b = await r.blob(); await playUrl(URL.createObjectURL(b)); stopFlap(); return; }
    } catch {}
    await speakBrowser(text); stopFlap();
  }

  // Écoute mains-libres (détection auto de fin de parole). Ne coupe jamais.
  function listen() {
    return new Promise((res) => {
      setState('listening');
      if (!SR) { setTimeout(() => res(''), NO_STT_WAIT); return; }
      const r = new SR(); r.lang = 'fr-FR'; r.interimResults = true; r.continuous = true;
      let txt = '', endT = null, nudgeT = setTimeout(() => { try { r.stop(); } catch {} }, NUDGE_MS);
      r.onresult = (e) => { txt = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim(); clearTimeout(nudgeT); if (endT) clearTimeout(endT); endT = setTimeout(() => { try { r.stop(); } catch {} }, END_MS); };
      r.onerror = () => {}; r.onend = () => { clearTimeout(nudgeT); res(txt); };
      try { r.start(); } catch { res(''); }
    });
  }

  function addWords(t) { canon(t).split(' ').forEach((w) => { if (w.length > 2) childWords.add(w); }); }
  function pickKeyword(t) {
    const w = canon(t).split(' ').filter(Boolean).reverse();
    return w.find((x) => x.length > 3 && !STOP.has(x) && !TABOU.includes(x)) || null;
  }

  // MODÈLE A : reprend le mot de l'enfant si possible, sinon relance ouverte. Validé par le filtre.
  async function childExchange() {
    let nudged = false;
    for (let i = 0; i < MAX_TURNS;) {
      const heard = await listen();
      if (!heard) { if (!nudged) { nudged = true; await speak(SILENCE_TXT); continue; } break; }
      addWords(heard);
      const kw = pickKeyword(heard);
      let relance = kw ? `Tu as parlé de ${kw}. Raconte-moi.` : OPEN_RELANCES[relIdx++ % OPEN_RELANCES.length];
      if (audit(relance, { childLexicon: childWords, lastChildUtterance: heard }).decision === 'BLOCK') relance = OPEN_RELANCES[relIdx++ % OPEN_RELANCES.length];
      await speak(relance);
      i++;
    }
  }

  async function run() {
    const byId = Object.fromEntries(script.phases.map((p) => [p.id, p]));
    for (const id of NEUTRAL_PHASES) {
      const phase = byId[id]; if (!phase) continue;
      for (const item of phase.items) {
        await speak(item.formulation);
        if (item.type === 'billy_demande') await childExchange();
      }
    }
    finish();
  }

  function finish() {
    setState('idle'); started = false;
    startBtn.textContent = 'Recommencer 🌰';
    start.hidden = false;
  }

  async function init() {
    try { script = await fetch('/content/script-billy.json').then((r) => r.json()); }
    catch { script = { phases: [] }; }
    startBtn.addEventListener('click', () => { if (started) return; started = true; start.hidden = true; childWords = new Set(); relIdx = 0; run(); });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  init();
})();
