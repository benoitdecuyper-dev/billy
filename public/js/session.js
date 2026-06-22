/*
 * Billy — moteur de SÉANCE (architecture prête pour la prod).
 *
 * - PILOTÉ PAR LE SÉLECTEUR : à chaque tour, le front demande à /api/next la prochaine réplique.
 *   Côté serveur, un LLM CHOISIT (jamais n'invente) une réplique du répertoire pré-validé
 *   (public/content/script-billy.json) ; sans clé LLM, repli déterministe. Le texte renvoyé est
 *   DÉJÀ validé par la couche sûreté ; le front le repasse une 2e fois par audit() (défense en profondeur).
 * - VOIX EN DIRECT : /api/tts (ElevenLabs si une clé est configurée) ; sinon, voix du navigateur.
 * - TEMPS RÉEL : l'enfant parle (STT navigateur) → Billy reprend SON mot ou enchaîne une invitation
 *   validée → filtre anti-suggestion AVANT la voix. Billy ne coupe jamais l'enfant.
 * - 2-5 ans : mains-libres (aucun bouton enfant), pas de sous-titres.
 * - Démo NEUTRE : seules les phases non-sensibles sont jouées (accueil, règles, récit neutre, clôture).
 *   Sur SIGNAL (détresse/révélation), Billy rassure sans qualifier, clôt et rappelle le 119.
 */
import { audit } from '/lib/antiSuggestion.js';

(() => {
  'use strict';

  const OPEN_RELANCES = ['Et après ?', "Dis-m'en plus.", 'Raconte-moi.', "Prends ton temps. Je t'écoute."];
  const END_MS = 2800, NUDGE_MS = 12000, NO_STT_WAIT = 5000, GUARD_MAX = 60;

  const app = document.querySelector('.app');
  const billy = document.getElementById('billy');
  const start = document.getElementById('start');
  const startBtn = document.getElementById('startBtn');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  let script = null, frVoice = null, flap = null, childWords = new Set(), started = false, tours = [];
  let PHASES = ['P1', 'P2', 'P3', 'P4', 'P7'], MAX_PER_PHASE = 6;

  const setState = (s) => { app.dataset.state = s; };
  const nowHM = () => new Date().toTimeString().slice(0, 5);
  const recordTurn = (acteur, texte) => tours.push({ heure: nowHM(), acteur, texte });
  const canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const phraseById = (id) => { for (const p of (script?.phases || [])) for (const it of p.items) if (it.id === id) return it.formulation; return null; };

  if ('speechSynthesis' in window) { const pv = () => { const v = speechSynthesis.getVoices().filter((x) => /^fr/i.test(x.lang)); frVoice = v.find((x) => /google|natural|naturel/i.test(x.name)) || v[0] || null; }; pv(); speechSynthesis.onvoiceschanged = pv; }

  function startFlap() { stopFlap(); flap = setInterval(() => billy.classList.toggle('open'), 140); }
  function stopFlap() { if (flap) { clearInterval(flap); flap = null; } billy.classList.remove('open'); }

  // Lip-sync RÉEL : la bouche s'ouvre selon l'amplitude de la voix (WebAudio). Repli sur le flap.
  let audioCtx = null;
  function playUrl(url) {
    return new Promise((res) => {
      const a = new Audio(url);
      let raf = null, analyser = null, data = null, ended = false;
      const done = () => { if (ended) return; ended = true; if (raf) cancelAnimationFrame(raf); stopFlap(); billy.classList.remove('open'); try { URL.revokeObjectURL(url); } catch {} res(); };
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        const src = audioCtx.createMediaElementSource(a);
        analyser = audioCtx.createAnalyser(); analyser.fftSize = 512;
        src.connect(analyser); analyser.connect(audioCtx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0; for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
          billy.classList.toggle('open', Math.sqrt(sum / data.length) > 0.05);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch { startFlap(); }
      a.onended = done; a.onerror = done; a.play().catch(done);
    });
  }
  function speakBrowser(text) {
    return new Promise((res) => {
      if (!('speechSynthesis' in window)) { res(); return; }
      const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = 0.9; u.pitch = 1.06;
      u.onend = res; u.onerror = res; speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
  }

  // Tout ce que Billy dit repasse le filtre AVANT la voix (fail-closed, défense en profondeur).
  async function speak(text) {
    setState('speaking');
    const v = audit(text, { childLexicon: childWords });
    if (v.decision === 'BLOCK') text = OPEN_RELANCES[0];
    recordTurn('Billy', text);
    try {
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (r.ok) { const b = await r.blob(); await playUrl(URL.createObjectURL(b)); return; }
    } catch {}
    startFlap(); await speakBrowser(text); stopFlap();
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

  // Demande la prochaine réplique au serveur (qui la choisit dans le répertoire + la valide).
  // Repli LOCAL (serveur injoignable) : invitation ouverte neutre.
  async function nextLine({ phaseId, turnInPhase, lastChild }) {
    try {
      const r = await fetch('/api/next', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, turnInPhase, childUtterance: lastChild, childWords: [...childWords], history: tours.slice(-8) }),
      });
      if (r.ok) { const j = await r.json(); if (j && typeof j.text === 'string' && j.text) return j; }
    } catch {}
    return { text: OPEN_RELANCES[turnInPhase % OPEN_RELANCES.length], expectsChild: true, signal: 'none', nextPhase: null };
  }

  // Sur SIGNAL : la réassurance a déjà été dite (renvoyée par le serveur). On clôt en douceur
  // et on rappelle le 119 à hauteur d'enfant. Aucune investigation supplémentaire.
  async function onSignal() {
    const c119 = phraseById('P7-2'); if (c119) await speak(c119);
    const close = phraseById('P7-1'); if (close) await speak(close);
  }

  // Boucle de séance, pilotée par le sélecteur. Termine sur clôture, signal, ou garde-fou.
  async function run() {
    let idx = 0, turnInPhase = 0, lastChild = '', guard = 0;
    while (guard++ < GUARD_MAX) {
      const phaseId = PHASES[idx];
      const out = await nextLine({ phaseId, turnInPhase, lastChild });
      await speak(out.text);

      if (out.signal && out.signal !== 'none') { await onSignal(); break; }

      lastChild = '';
      if (out.expectsChild) {
        const heard = await listen();
        if (heard) { addWords(heard); recordTurn('Enfant', heard); lastChild = heard; }
      }
      turnInPhase++;

      // Avancement de phase : choix du serveur (vers l'avant) ou plafond de tours.
      let target = idx;
      const want = out.nextPhase ? PHASES.indexOf(out.nextPhase) : -1;
      if (want > idx) target = want;
      else if (turnInPhase >= MAX_PER_PHASE) target = idx + 1;
      if (target > idx) {
        if (target >= PHASES.length) break;
        idx = target; turnInPhase = 0;
      }
      // Fin naturelle : phase de clôture atteinte et assez dite.
      if (idx === PHASES.length - 1 && turnInPhase >= 2) break;
    }
    finish();
  }

  function finish() {
    setState('idle'); started = false;
    startBtn.textContent = 'Recommencer 🌰';
    start.hidden = false;
    showReportLink();
  }

  // Rapport de séance (côté ADULTE) : génère le PDF depuis l'échange (verbatim). Démo neutre.
  function showReportLink() {
    let link = document.getElementById('reportLink');
    if (!link) {
      link = document.createElement('button');
      link.id = 'reportLink'; link.className = 'start__btn';
      link.style.cssText = 'background:#fff;color:#ec7a1e;border:2px solid #ec7a1e;box-shadow:none;margin-top:.6rem';
      link.addEventListener('click', openReport);
      start.appendChild(link);
    }
    link.textContent = '📄 Voir le rapport de séance';
    link.style.display = '';
  }
  async function openReport() {
    const session = {
      date: new Date().toLocaleDateString('fr-FR'), debut: tours[0]?.heure || nowHM(), fin: nowHM(), duree: '—',
      enfant: { prenom: '(non saisi)', age: '2-5 ans' }, version: 'séance démo (contenu neutre)',
      tours, recap: [], signaux: [],
    };
    try {
      const r = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(session) });
      const b = await r.blob(); const u = URL.createObjectURL(b); window.open(u, '_blank');
      setTimeout(() => { try { URL.revokeObjectURL(u); } catch {} }, 60000);
    } catch {}
  }

  async function init() {
    try { script = await fetch('/content/script-billy.json').then((r) => r.json()); }
    catch { script = { phases: [] }; }
    const sel = script.selecteur || {};
    if (Array.isArray(sel.phases_demo_neutre) && sel.phases_demo_neutre.length) PHASES = sel.phases_demo_neutre;
    if (sel.max_tours_par_phase) MAX_PER_PHASE = sel.max_tours_par_phase;
    startBtn.addEventListener('click', () => {
      if (started) return; started = true; start.hidden = true;
      childWords = new Set(); tours = [];
      const rl = document.getElementById('reportLink'); if (rl) rl.style.display = 'none';
      run();
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  init();
})();
