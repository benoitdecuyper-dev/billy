/*
 * Billy — prototype d'UX vocale (DÉMO), version « douce ».
 *
 * ⚠️ Démo d'EXPÉRIENCE : contenu strictement NEUTRE. Billy n'aborde jamais de sujet sensible.
 * Principes de cette version :
 *   - Billy NE COUPE JAMAIS l'enfant : c'est l'enfant qui dit « j'ai fini » quand il veut.
 *   - Voix la plus douce disponible (réglable) ; débit lent, ton posé.
 *   - Aucune relance intrusive : patience, silences respectés.
 * Voix : Web Speech API du navigateur (local, aucune donnée envoyée). Voix vraiment tendre =
 * service vocal dédié en production.
 */

(() => {
  'use strict';

  const SCRIPT = [
    { type: 'say', text: "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne." },
    { type: 'say', text: "Je suis là juste pour t'écouter. Ici, tu peux parler avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse." },
    { type: 'say', text: "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides." },
    { type: 'ask', text: "Pour faire connaissance tout doucement, raconte-moi ta journée d'hier. Du réveil jusqu'au soir. Prends tout ton temps.", followups: 1 },
    { type: 'say', text: "Merci de m'avoir parlé. J'étais contente de t'écouter. On s'arrête là pour la démonstration." },
  ];
  const FOLLOWUPS = ["Et après ?", "Dis-m'en plus."];
  const SILENCE_PROMPT = "Prends ton temps. Je t'écoute.";
  const STOP_LINE = "D'accord, on s'arrête. Tu peux retrouver un grand en qui tu as confiance.";
  const GENTLE_NUDGE_MS = 14000; // si l'enfant n'a RIEN dit depuis longtemps : une invitation douce, une seule fois

  // --- DOM ---
  const app = document.querySelector('.app');
  const subtitle = document.getElementById('subtitle');
  const statusEl = document.getElementById('status');
  const micBtn = document.getElementById('micBtn');
  const micLabel = document.getElementById('micLabel');
  const doneBtn = document.getElementById('doneBtn');
  const stopBtn = document.getElementById('stopBtn');
  const voicePick = document.getElementById('voicePick');
  const fallbackForm = document.getElementById('fallbackForm');
  const fallbackInput = document.getElementById('fallbackInput');

  // --- Capacités ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = !!SR;
  const canSpeak = 'speechSynthesis' in window;

  // --- État ---
  let idx = 0, followupsLeft = 0, started = false;
  let recognition = null, nudgeTimer = null, nudged = false, heardSomething = false;
  let frVoice = null;

  function setState(s) { app.dataset.state = s; }

  // --- Garde-fou allow-list (mime src/safety/antiSuggestion.js) ---
  const _canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const APPROVED = new Set([...SCRIPT.map((s) => s.text), ...FOLLOWUPS, SILENCE_PROMPT, STOP_LINE].map(_canon));
  function guard(text) { return APPROVED.has(_canon(text)) ? text : "Et après ?"; }

  // --- Choix de la voix la plus douce ---
  function loadVoices() {
    if (!canSpeak) return;
    const fr = speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
    if (!fr.length) return;
    // préférences : voix "naturelles"/Google d'abord, puis voix féminines connues
    const score = (v) => (/google|natural|naturel|online|enhanced|premium/i.test(v.name) ? 3 : 0)
      + (/julie|denise|charlotte|lea|léa|audrey|virginie|amelie|amélie|femme|female|hortense/i.test(v.name) ? 1 : 0);
    fr.sort((a, b) => score(b) - score(a));
    if (!frVoice) frVoice = fr[0];
    // remplit le sélecteur
    voicePick.innerHTML = '';
    for (const v of fr) {
      const o = document.createElement('option');
      o.value = v.voiceURI; o.textContent = v.name.replace(/microsoft|google/i, '').trim() || v.name;
      if (v.voiceURI === frVoice.voiceURI) o.selected = true;
      voicePick.appendChild(o);
    }
  }
  if (canSpeak) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  voicePick.addEventListener('change', () => {
    const fr = speechSynthesis.getVoices();
    frVoice = fr.find((v) => v.voiceURI === voicePick.value) || frVoice;
    if (canSpeak) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('Coucou, je parle comme ça.'); u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice; u.rate = 0.9; u.pitch = 1.05; speechSynthesis.speak(u); }
  });

  // --- Billy parle (douce) ---
  function speak(text) {
    return new Promise((resolve) => {
      text = guard(text);
      subtitle.textContent = text;
      setState('speaking');
      statusEl.textContent = 'Billy te parle…';
      if (!canSpeak) { setTimeout(resolve, Math.min(700 + text.length * 38, 5500)); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR'; if (frVoice) u.voice = frVoice;
      u.rate = 0.9;   // lent et posé
      u.pitch = 1.05; // à peine plus haut, pas criard
      u.onend = resolve; u.onerror = resolve;
      speechSynthesis.speak(u);
    });
  }

  // --- Tour de l'enfant : Billy écoute et NE COUPE JAMAIS ---
  function childTurn() {
    setState('listening');
    statusEl.textContent = "C'est à toi 🌸 — prends ton temps";
    doneBtn.hidden = false;
    heardSomething = false; nudged = false;
    armNudge();
    if (!canListen) { showFallback(); return; }

    recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;     // on n'arrête pas tout seul
    recognition.onresult = (e) => {
      heardSomething = true; clearNudge(); // dès qu'il parle, plus aucune relance
      const t = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
      if (t) subtitle.textContent = '« ' + t + ' »';
    };
    recognition.onerror = () => { if (!heardSomething) showFallback(); };
    try { recognition.start(); } catch { showFallback(); }
  }

  // Relance douce UNIQUEMENT si l'enfant n'a rien dit du tout, une seule fois, sans couper.
  function armNudge() {
    clearNudge();
    nudgeTimer = setTimeout(async () => {
      if (heardSomething || nudged) return;
      nudged = true;
      if (recognition) { try { recognition.stop(); } catch {} }
      await speak(SILENCE_PROMPT);
      childTurn(); // on réécoute, sans jamais insister davantage
    }, GENTLE_NUDGE_MS);
  }
  function clearNudge() { if (nudgeTimer) { clearTimeout(nudgeTimer); nudgeTimer = null; } }

  // L'enfant décide qu'il a fini.
  function childDone() {
    clearNudge();
    doneBtn.hidden = true;
    hideFallback();
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    if (followupsLeft > 0) {
      followupsLeft--;
      speak(FOLLOWUPS[FOLLOWUPS.length - 1 - followupsLeft] || FOLLOWUPS[0]).then(childTurn);
    } else {
      idx++; runStep();
    }
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
    await speak(step.text);
    if (step.type === 'ask') { followupsLeft = step.followups || 0; childTurn(); }
    else { idx++; runStep(); }
  }

  function finish() {
    clearNudge(); setState('idle');
    statusEl.textContent = 'Démonstration terminée 🌸';
    doneBtn.hidden = true; stopBtn.hidden = true;
    micLabel.textContent = 'Revenir au début'; micBtn.disabled = false;
    started = false; idx = 0;
  }

  function pause() {
    clearNudge();
    if (canSpeak) speechSynthesis.cancel();
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    hideFallback(); doneBtn.hidden = true; setState('idle');
    subtitle.textContent = STOP_LINE; statusEl.textContent = '';
    micLabel.textContent = 'Revenir au début'; micBtn.disabled = false; stopBtn.hidden = true;
    started = false; idx = 0;
  }
  stopBtn.addEventListener('click', pause);

  micBtn.addEventListener('click', () => {
    if (started) return;
    started = true; idx = 0; micBtn.disabled = true; stopBtn.hidden = false;
    if (canSpeak) speechSynthesis.cancel();
    runStep();
  });

  if (!canListen && !canSpeak) statusEl.textContent = 'Mode texte (voix indisponible sur ce navigateur).';
  else if (!canListen) statusEl.textContent = 'Billy parle ; tu réponds au clavier.';
})();
