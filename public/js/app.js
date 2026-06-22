/*
 * Billy — expérience enfant (DÉMO). Cible 2-5 ans.
 *
 * ⚠️ Démo d'EXPÉRIENCE : contenu strictement NEUTRE. Billy n'aborde jamais de sujet sensible ici.
 *
 * UX :
 *  - AUCUN bouton ni texte dans l'écran enfant : juste Billy. L'ADULTE lance (écran de départ),
 *    puis donne le téléphone à l'enfant.
 *  - Billy parle (audio pré-rendu, voix « Chloé »), sa bouche bouge, et il ÉCOUTE en mains-libres
 *    (détection automatique de fin de parole). Il NE COUPE JAMAIS l'enfant.
 *  - Billy est un personnage fictif sympa (un écureuil) ; il ne parle pas de « téléphone ».
 *  - Continuité « silencieuse » (BILLY-E15) : on ne mémorise que l'étape, jamais le contenu.
 */

(() => {
  'use strict';

  const SCRIPT = [
    { type: 'say', audio: 'a1', text: "Coucou ! Moi, c'est Billy. Je suis un petit écureuil tout doux. Je suis trop content de te voir !" },
    { type: 'say', audio: 'gym', anim: 'gym', text: "Tu sais quoi ? Moi, j'adore la gymnastique ! Je fais des roulades, et des roues, et hop, hop, hop !" },
    { type: 'say', audio: 'rugby', anim: 'rugby', text: "Et j'adore aussi le rugby ! Je cours super vite avec le ballon, et hop, j'attrape !" },
    { type: 'say', audio: 'foot', anim: 'foot', text: "Et au foot ! Je cours, je shoote dans le ballon… et boum, dans le but !" },
    { type: 'say', audio: 'danse', anim: 'danse', text: "Et tu sais ce que je préfère ? Danser ! Je bouge dans tous les sens, c'est trop rigolo !" },
    { type: 'say', audio: 'a2', text: "Je suis là juste pour t'écouter. Ici, tu peux parler avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse." },
    { type: 'say', audio: 'a3', text: "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides." },
    { type: 'ask', audio: 'a4', followups: 1, text: "Pour faire connaissance tout doucement, raconte-moi ta journée d'hier. Du réveil jusqu'au soir. Prends tout ton temps." },
    { type: 'say', audio: 'a5', text: "Merci de m'avoir parlé. J'étais contente de t'écouter. On s'arrête là pour la démonstration." },
  ];
  const FOLLOWUPS = [{ audio: 'f1', text: "Et après ?" }, { audio: 'f2', text: "Dis-m'en plus." }];
  const SILENCE = { audio: 'silence', text: "Prends ton temps. Je t'écoute." };
  const STOP = { audio: 'stop', text: "D'accord, on s'arrête. Tu peux retrouver un grand en qui tu as confiance." };
  const END_OF_SPEECH_MS = 2800;  // silence après la parole de l'enfant => on enchaîne (sans couper)
  const GENTLE_NUDGE_MS = 14000;  // si rien n'est dit : une invitation douce, une seule fois
  const NO_STT_WAIT_MS = 5000;    // sans reconnaissance vocale : on attend puis on avance

  const app = document.querySelector('.app');
  const billy = document.getElementById('billy');
  const start = document.getElementById('start');
  const startBtn = document.getElementById('startBtn');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = !!SR;

  let idx = 0, followupsLeft = 0, started = false;
  let recognition = null, nudgeTimer = null, nudged = false, heardSomething = false, endTimer = null, waitTimer = null;
  let audioEl = null, flapTimer = null;

  function setState(s) { app.dataset.state = s; }

  // --- Continuité silencieuse : navigation seulement ---
  const NAV_KEY = 'billy_nav';
  function saveNav() { try { localStorage.setItem(NAV_KEY, JSON.stringify({ phaseIdx: idx, ts: Date.now() })); } catch {} }
  function loadNavIdx() { try { const n = JSON.parse(localStorage.getItem(NAV_KEY) || '{}'); return (n.phaseIdx > 0 && n.phaseIdx < SCRIPT.length) ? n.phaseIdx : 0; } catch { return 0; } }
  function clearNav() { try { localStorage.removeItem(NAV_KEY); } catch {} }

  // --- Garde-fou allow-list (mime src/safety/) : on ne joue que des répliques validées ---
  const _canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const APPROVED = new Set([...SCRIPT, ...FOLLOWUPS, SILENCE, STOP].map((l) => _canon(l.text)));
  const approved = (line) => APPROVED.has(_canon(line.text));

  // Voix du navigateur (repli quand un clip pré-enregistré manque encore, ex. foot/danse).
  let frVoice = null;
  if ('speechSynthesis' in window) {
    const pv = () => { const v = speechSynthesis.getVoices().filter((x) => /^fr/i.test(x.lang)); frVoice = v.find((x) => /google|natural|naturel/i.test(x.name)) || v[0] || null; };
    pv(); speechSynthesis.onvoiceschanged = pv;
  }
  function speakBrowser(text, cb) {
    if (!('speechSynthesis' in window)) { cb(); return; }
    const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = 0.95; u.pitch = 1.08;
    u.onend = cb; u.onerror = cb;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  // --- Billy parle : audio + bouche animée (aucun texte affiché) ---
  function speak(line) {
    return new Promise((resolve) => {
      setState('speaking');
      if (!approved(line)) { resolve(); return; }
      if (line.anim) billy.dataset.anim = line.anim; else startFlap(); // gym/rugby/foot/danse : on anime, pas de bouche
      let finished = false;
      const done = () => { if (finished) return; finished = true; stopFlap(); billy.removeAttribute('data-anim'); resolve(); };
      audioEl = new Audio('/assets/audio/' + line.audio + '.mp3');
      audioEl.onended = done;
      audioEl.onerror = () => { if (!finished) speakBrowser(line.text, done); }; // pas de clip -> voix du navigateur
      audioEl.play().catch(() => { if (!finished) speakBrowser(line.text, done); });
    });
  }
  function startFlap() { stopFlap(); flapTimer = setInterval(() => billy.classList.toggle('open'), 140); }
  function stopFlap() { if (flapTimer) { clearInterval(flapTimer); flapTimer = null; } billy.classList.remove('open'); }
  function stopAudio() { if (audioEl) { try { audioEl.pause(); } catch {} audioEl.onended = null; audioEl = null; } stopFlap(); }

  // --- Tour de l'enfant : écoute mains-libres, NE COUPE JAMAIS ---
  function childTurn() {
    setState('listening');
    heardSomething = false; nudged = false;
    armNudge();
    if (!canListen) { waitTimer = setTimeout(childDone, NO_STT_WAIT_MS); return; }
    recognition = new SR();
    recognition.lang = 'fr-FR'; recognition.interimResults = true; recognition.continuous = true;
    recognition.onresult = () => {
      heardSomething = true; clearNudge();
      clearEnd(); endTimer = setTimeout(childDone, END_OF_SPEECH_MS); // fin de parole auto
    };
    recognition.onerror = () => {};
    try { recognition.start(); } catch { waitTimer = setTimeout(childDone, NO_STT_WAIT_MS); }
  }
  function clearEnd() { if (endTimer) { clearTimeout(endTimer); endTimer = null; } }
  function clearWait() { if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; } }
  function armNudge() {
    clearNudge();
    nudgeTimer = setTimeout(async () => {
      if (heardSomething || nudged) return;
      nudged = true;
      if (recognition) { try { recognition.stop(); } catch {} }
      await speak(SILENCE); childTurn();
    }, GENTLE_NUDGE_MS);
  }
  function clearNudge() { if (nudgeTimer) { clearTimeout(nudgeTimer); nudgeTimer = null; } }

  function childDone() {
    if (app.dataset.state !== 'listening') return; // anti double-déclenchement
    clearNudge(); clearEnd(); clearWait();
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    if (followupsLeft > 0) { followupsLeft--; speak(FOLLOWUPS[FOLLOWUPS.length - 1 - followupsLeft] || FOLLOWUPS[0]).then(childTurn); }
    else { idx++; runStep(); }
  }

  async function runStep() {
    if (idx >= SCRIPT.length) { finish(); return; }
    saveNav();
    const step = SCRIPT[idx];
    await speak(step);
    if (step.type === 'ask') { followupsLeft = step.followups || 0; childTurn(); }
    else { idx++; runStep(); }
  }

  function finish() {
    clearNudge(); clearEnd(); clearWait(); stopAudio(); setState('idle'); clearNav();
    started = false; idx = 0;
    startBtn.textContent = 'Recommencer 🌰';
    start.hidden = false; // réaffiche l'écran adulte (pour relancer)
  }

  function begin() {
    if (started) return;
    started = true; idx = loadNavIdx();
    start.hidden = true; // l'adulte donne le téléphone à l'enfant
    runStep();
  }
  startBtn.addEventListener('click', begin);

  if (loadNavIdx() > 0) startBtn.textContent = 'Reprendre 🌰';
})();
