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

  let script = null, frVoice = null, flap = null, childWords = new Set(), relIdx = 0, started = false, tours = [];

  const setState = (s) => { app.dataset.state = s; };
  const nowHM = () => new Date().toTimeString().slice(0, 5);
  const recordTurn = (acteur, texte) => tours.push({ heure: nowHM(), acteur, texte });
  const canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

  if ('speechSynthesis' in window) { const pv = () => { const v = speechSynthesis.getVoices().filter((x) => /^fr/i.test(x.lang)); frVoice = v.find((x) => /google|natural|naturel/i.test(x.name)) || v[0] || null; }; pv(); speechSynthesis.onvoiceschanged = pv; }

  function startFlap() { stopFlap(); flap = setInterval(() => billy.classList.toggle('open'), 140); }
  function stopFlap() { if (flap) { clearInterval(flap); flap = null; } billy.classList.remove('open'); }

  // V2-4 — Lip-sync RÉEL : la bouche s'ouvre selon l'amplitude de la voix (WebAudio), pas un
  // clignotement fixe. Repli sur le flap si l'analyse audio n'est pas disponible.
  let audioCtx = null;
  function playUrl(url) {
    return new Promise((res) => {
      const a = new Audio(url);
      let raf = null, analyser = null, data = null, ended = false;
      const done = () => { if (ended) return; ended = true; if (raf) cancelAnimationFrame(raf); stopFlap(); billy.classList.remove('open'); res(); };
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
          billy.classList.toggle('open', Math.sqrt(sum / data.length) > 0.05); // seuil d'ouverture
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch { startFlap(); } // WebAudio indisponible -> flap simple
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

  // Tout ce que Billy dit passe le filtre AVANT la voix (fail-closed).
  async function speak(text) {
    setState('speaking');
    const v = audit(text, { childLexicon: childWords });
    if (v.decision === 'BLOCK') text = OPEN_RELANCES[0]; // garde-fou : repli sur invitation ouverte
    recordTurn('Billy', text);
    try {
      const r = await fetch('/api/tts?text=' + encodeURIComponent(text));
      if (r.ok) { const b = await r.blob(); await playUrl(URL.createObjectURL(b)); return; } // lip-sync géré dans playUrl
    } catch {}
    startFlap(); await speakBrowser(text); stopFlap(); // voix navigateur : pas d'analyse audio -> flap simple
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
      addWords(heard); recordTurn('Enfant', heard);
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
    const now = new Date();
    const session = {
      date: now.toLocaleDateString('fr-FR'), debut: tours[0]?.heure || nowHM(), fin: nowHM(), duree: '—',
      enfant: { prenom: '(non saisi)', age: '2-5 ans' }, version: 'séance démo (contenu neutre)',
      tours, recap: [], signaux: [],
    };
    try {
      const r = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(session) });
      const b = await r.blob(); window.open(URL.createObjectURL(b), '_blank');
    } catch {}
  }

  async function init() {
    try { script = await fetch('/content/script-billy.json').then((r) => r.json()); }
    catch { script = { phases: [] }; }
    startBtn.addEventListener('click', () => {
      if (started) return; started = true; start.hidden = true;
      childWords = new Set(); relIdx = 0; tours = [];
      const rl = document.getElementById('reportLink'); if (rl) rl.style.display = 'none';
      run();
    });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  init();
})();
