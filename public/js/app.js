/*
 * Billy — prototype d'UX vocale (DÉMO), avatar écureuil + voix Chloé pré-enregistrée.
 *
 * ⚠️ Démo d'EXPÉRIENCE : contenu strictement NEUTRE (accueil + « raconte ta journée d'hier »).
 * Billy n'aborde jamais de sujet sensible ici.
 *
 * - Voix : fichiers audio pré-rendus (ElevenLabs « Chloé »), un par réplique du répertoire
 *   fermé. En Option A, Billy ne dit QUE des répliques validées → on peut tout pré-rendre.
 * - « Il parle quand il parle » : pendant la lecture audio, on alterne 2 images (bouche
 *   fermée / ouverte) → effet de bouche qui bouge.
 * - Billy NE COUPE JAMAIS l'enfant : c'est l'enfant qui dit « j'ai fini ».
 */

(() => {
  'use strict';

  const SCRIPT = [
    { type: 'say', audio: 'a1', text: "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne." },
    { type: 'say', audio: 'a2', text: "Je suis là juste pour t'écouter. Ici, tu peux parler avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse." },
    { type: 'say', audio: 'a3', text: "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides." },
    { type: 'ask', audio: 'a4', followups: 1, text: "Pour faire connaissance tout doucement, raconte-moi ta journée d'hier. Du réveil jusqu'au soir. Prends tout ton temps." },
    { type: 'say', audio: 'a5', text: "Merci de m'avoir parlé. J'étais contente de t'écouter. On s'arrête là pour la démonstration." },
  ];
  const FOLLOWUPS = [{ audio: 'f1', text: "Et après ?" }, { audio: 'f2', text: "Dis-m'en plus." }];
  const SILENCE = { audio: 'silence', text: "Prends ton temps. Je t'écoute." };
  const STOP = { audio: 'stop', text: "D'accord, on s'arrête. Tu peux retrouver un grand en qui tu as confiance." };
  const GENTLE_NUDGE_MS = 14000;
  const END_OF_SPEECH_MS = 2800; // mains-libres : silence après la parole de l'enfant => on enchaîne (sans couper)

  // --- DOM ---
  const app = document.querySelector('.app');
  const billy = document.getElementById('billy');
  const subtitle = document.getElementById('subtitle');
  const statusEl = document.getElementById('status');
  const micBtn = document.getElementById('micBtn');
  const micLabel = document.getElementById('micLabel');
  const doneBtn = document.getElementById('doneBtn');
  const stopBtn = document.getElementById('stopBtn');
  const fallbackForm = document.getElementById('fallbackForm');
  const fallbackInput = document.getElementById('fallbackInput');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = !!SR;

  let idx = 0, followupsLeft = 0, started = false;
  let recognition = null, nudgeTimer = null, nudged = false, heardSomething = false, endTimer = null;
  let audioEl = null, flapTimer = null;

  function setState(s) { app.dataset.state = s; }

  // --- Garde-fou allow-list (mime src/safety/) ---
  const _canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const APPROVED = new Set([...SCRIPT, ...FOLLOWUPS, SILENCE, STOP].map((l) => _canon(l.text)));
  function approved(line) { return APPROVED.has(_canon(line.text)); }

  // --- Billy parle : joue l'audio + anime la bouche ---
  function speak(line) {
    return new Promise((resolve) => {
      subtitle.textContent = line.text;
      setState('speaking');
      statusEl.textContent = 'Billy te parle…';
      // garde-fou : on ne joue que des répliques validées
      if (!approved(line)) { resolve(); return; }
      startFlap();
      audioEl = new Audio('/assets/audio/' + line.audio + '.mp3');
      const done = () => { stopFlap(); resolve(); };
      audioEl.onended = done;
      audioEl.onerror = done;
      audioEl.play().catch(done); // si l'autoplay est bloqué, on n'reste pas coincé
    });
  }
  function startFlap() {
    stopFlap();
    flapTimer = setInterval(() => billy.classList.toggle('open'), 140);
  }
  function stopFlap() {
    if (flapTimer) { clearInterval(flapTimer); flapTimer = null; }
    billy.classList.remove('open');
  }
  function stopAudio() {
    if (audioEl) { try { audioEl.pause(); } catch {} audioEl.onended = null; audioEl = null; }
    stopFlap();
  }

  // --- Tour de l'enfant : Billy écoute et NE COUPE JAMAIS ---
  function childTurn() {
    setState('listening');
    statusEl.textContent = "À toi 🌰 — je t'écoute";
    doneBtn.hidden = true; // mains-libres : l'enfant n'a aucun bouton à actionner (cf. ux-2-5.md)
    heardSomething = false; nudged = false;
    armNudge();
    if (!canListen) { doneBtn.hidden = false; showFallback(); return; }
    recognition = new SR();
    recognition.lang = 'fr-FR'; recognition.interimResults = true; recognition.continuous = true;
    recognition.onresult = (e) => {
      heardSomething = true; clearNudge();
      const t = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
      if (t) subtitle.textContent = '« ' + t + ' »';
      // détection auto de fin de parole : on (ré)arme un délai de silence ; s'il expire, on enchaîne
      clearEnd();
      endTimer = setTimeout(childDone, END_OF_SPEECH_MS);
    };
    recognition.onerror = () => { if (!heardSomething) showFallback(); };
    try { recognition.start(); } catch { showFallback(); }
  }
  function clearEnd() { if (endTimer) { clearTimeout(endTimer); endTimer = null; } }
  function armNudge() {
    clearNudge();
    nudgeTimer = setTimeout(async () => {
      if (heardSomething || nudged) return;
      nudged = true;
      if (recognition) { try { recognition.stop(); } catch {} }
      await speak(SILENCE);
      childTurn();
    }, GENTLE_NUDGE_MS);
  }
  function clearNudge() { if (nudgeTimer) { clearTimeout(nudgeTimer); nudgeTimer = null; } }

  function childDone() {
    if (app.dataset.state !== 'listening') return; // garde anti double-déclenchement (timer + clic)
    clearNudge(); clearEnd(); doneBtn.hidden = true; hideFallback();
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    if (followupsLeft > 0) {
      followupsLeft--;
      speak(FOLLOWUPS[FOLLOWUPS.length - 1 - followupsLeft] || FOLLOWUPS[0]).then(childTurn);
    } else { idx++; runStep(); }
  }
  doneBtn.addEventListener('click', childDone);

  // --- Repli clavier ---
  function showFallback() { fallbackForm.hidden = false; setTimeout(() => fallbackInput.focus(), 50); }
  function hideFallback() { fallbackForm.hidden = true; }
  fallbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = fallbackInput.value.trim(); if (!v) return;
    heardSomething = true; subtitle.textContent = '« ' + v + ' »'; fallbackInput.value = '';
    childDone();
  });

  // --- Déroulé ---
  async function runStep() {
    if (idx >= SCRIPT.length) { finish(); return; }
    const step = SCRIPT[idx];
    await speak(step);
    if (step.type === 'ask') { followupsLeft = step.followups || 0; childTurn(); }
    else { idx++; runStep(); }
  }

  function finish() {
    clearNudge(); clearEnd(); stopAudio(); setState("idle");
    statusEl.textContent = 'Démonstration terminée 🌸';
    doneBtn.hidden = true; stopBtn.hidden = true;
    micLabel.textContent = 'Revenir au début'; micBtn.disabled = false;
    started = false; idx = 0;
  }

  async function pause() {
    clearNudge(); clearEnd(); stopAudio();
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    hideFallback(); doneBtn.hidden = true;
    started = false; idx = 0;
    await speak(STOP);
    setState('idle'); statusEl.textContent = '';
    micLabel.textContent = 'Revenir au début'; micBtn.disabled = false; stopBtn.hidden = true;
  }
  stopBtn.addEventListener('click', () => { if (started) pause(); });

  micBtn.addEventListener('click', () => {
    if (started) return;
    started = true; idx = 0; micBtn.disabled = true; stopBtn.hidden = false;
    runStep();
  });

  if (!canListen) statusEl.textContent = 'Astuce : la reconnaissance vocale marche sur Chrome/Edge ; sinon, tu pourras écrire.';
})();
