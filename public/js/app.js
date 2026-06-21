/*
 * Billy — prototype d'UX vocale (DÉMO).
 *
 * ⚠️ Démo d'EXPÉRIENCE uniquement : contenu strictement NEUTRE (accueil + récit d'une
 * journée ordinaire). Billy n'aborde JAMAIS de sujet sensible ici. Toutes les répliques
 * proviennent d'un répertoire fermé, codé en dur (cf. docs/repertoire-formulations_V1.md).
 * En production (Option A), ces répliques passeraient en plus par la couche src/safety/.
 *
 * Voix : Web Speech API du navigateur (SpeechSynthesis + SpeechRecognition).
 * Aucune clé, aucun appel réseau, aucune donnée envoyée. Tout reste sur l'appareil.
 * Reconnaissance vocale : Chrome / Edge (webkit). Sinon → repli clavier automatique.
 */

(() => {
  'use strict';

  // --- Répertoire fermé NEUTRE de la démo (phases 1→5 + clôture neutre) ---
  // type: 'say' = Billy parle puis enchaîne ; 'ask' = Billy parle puis écoute l'enfant.
  const SCRIPT = [
    { type: 'say', text: "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne." },
    { type: 'say', text: "Je suis là juste pour t'écouter. Ici, tu peux parler avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse." },
    { type: 'say', text: "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides." },
    { type: 'say', text: "Avant de commencer, trois petites choses. Un : si je me trompe, tu peux me corriger." },
    { type: 'say', text: "Deux : si tu ne sais pas, tu peux me dire « je ne sais pas ». Ce n'est pas grave." },
    { type: 'say', text: "Trois : on parle seulement de ce qui s'est vraiment passé. On ne devine pas." },
    { type: 'ask', text: "Pour commencer tout doucement, raconte-moi ta journée d'hier. Du réveil jusqu'au moment où tu t'es couché. Prends ton temps.", followups: 2 },
    { type: 'say', text: "Merci de m'avoir parlé. On s'arrête là pour la démonstration." },
  ];

  // Relances ouvertes neutres (seules relances autorisées).
  const FOLLOWUPS = ["Et après ?", "Dis-m'en plus.", "Et ensuite, qu'est-ce qui s'est passé ?"];
  // Relance unique en cas de silence (invitation ouverte, jamais une question fermée).
  const SILENCE_PROMPT = "Prends ton temps. Je t'écoute.";
  const STOP_LINE = "D'accord, on s'arrête. Tu peux retrouver un grand en qui tu as confiance.";

  const SILENCE_MS = 8000; // délai généreux avant l'unique relance de silence (aligné spec)

  // --- Garde-fou allow-list (mime src/safety/antiSuggestion.js en prod : 100% des sorties validées) ---
  const _canon = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const APPROVED = new Set([...SCRIPT.map((s) => s.text), ...FOLLOWUPS, SILENCE_PROMPT, STOP_LINE].map(_canon));
  // Fail-closed : toute réplique hors répertoire est remplacée par une invitation neutre sûre.
  function guard(text) { return APPROVED.has(_canon(text)) ? text : "Et après ?"; }

  // --- DOM ---
  const app = document.querySelector('.app');
  const subtitle = document.getElementById('subtitle');
  const statusEl = document.getElementById('status');
  const micBtn = document.getElementById('micBtn');
  const micLabel = document.getElementById('micLabel');
  const stopBtn = document.getElementById('stopBtn');
  const fallbackForm = document.getElementById('fallbackForm');
  const fallbackInput = document.getElementById('fallbackInput');

  // --- Capacités ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = !!SR;
  const canSpeak = 'speechSynthesis' in window;

  // --- État ---
  let idx = 0;
  let followupsLeft = 0;
  let started = false;
  let recognition = null;
  let silenceTimer = null;
  let frVoice = null;

  function setState(s) { app.dataset.state = s; }

  function pickFrenchVoice() {
    if (!canSpeak) return;
    const voices = speechSynthesis.getVoices();
    frVoice = voices.find(v => /fr-FR/i.test(v.lang)) || voices.find(v => /^fr/i.test(v.lang)) || null;
  }
  if (canSpeak) {
    pickFrenchVoice();
    speechSynthesis.onvoiceschanged = pickFrenchVoice;
  }

  // --- Billy parle (TTS) ---
  function speak(text) {
    return new Promise((resolve) => {
      text = guard(text); // rempart : aucune sortie hors répertoire signé
      subtitle.textContent = text;
      setState('speaking');
      statusEl.textContent = 'Billy parle…';
      if (!canSpeak) { setTimeout(resolve, Math.min(600 + text.length * 35, 5000)); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      if (frVoice) u.voice = frVoice;
      u.rate = 0.92;   // débit lent, voix douce
      u.pitch = 1.12;
      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    });
  }

  // --- Billy écoute (STT) ou repli clavier ---
  function listen() {
    setState('listening');
    statusEl.textContent = 'Billy t\'écoute…';
    if (!canListen) { showFallback(); return; }

    recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;

    let got = false;
    armSilence();

    recognition.onresult = (e) => {
      got = true;
      clearSilence();
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      subtitle.textContent = '« ' + transcript + ' »';
      if (e.results[e.results.length - 1].isFinal) {
        recognition.stop();
        onChildSpoke();
      }
    };
    recognition.onerror = () => { clearSilence(); if (!got) showFallback(); };
    recognition.onend = () => { clearSilence(); };
    try { recognition.start(); } catch { showFallback(); }
  }

  function armSilence() {
    clearSilence();
    silenceTimer = setTimeout(async () => {
      if (recognition) { try { recognition.stop(); } catch {} }
      await speak(SILENCE_PROMPT);     // unique relance ouverte
      listen();                        // on réécoute, sans insister davantage
    }, SILENCE_MS);
  }
  function clearSilence() { if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; } }

  // Réponse de l'enfant reçue → relance ouverte (max followups) puis on avance.
  async function onChildSpoke() {
    if (followupsLeft > 0) {
      followupsLeft--;
      const f = FOLLOWUPS[(2 - followupsLeft) % FOLLOWUPS.length];
      await speak(f);
      listen();
    } else {
      idx++;
      runStep();
    }
  }

  // --- Repli clavier ---
  function showFallback() {
    setState('listening');
    fallbackForm.hidden = false;
    fallbackInput.focus();
    statusEl.textContent = canListen ? 'Tu peux aussi écrire.' : 'Écris ta réponse à Billy.';
  }
  function hideFallback() { fallbackForm.hidden = true; }
  fallbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = fallbackInput.value.trim();
    if (!v) return;
    subtitle.textContent = '« ' + v + ' »';
    fallbackInput.value = '';
    hideFallback();
    clearSilence();
    onChildSpoke();
  });

  // --- Déroulé du script ---
  async function runStep() {
    if (idx >= SCRIPT.length) { finish(); return; }
    const step = SCRIPT[idx];
    await speak(step.text);
    if (step.type === 'ask') {
      followupsLeft = step.followups || 0;
      listen();
    } else {
      idx++;
      runStep();
    }
  }

  function finish() {
    setState('idle');
    subtitle.textContent = subtitle.textContent || '🌼';
    statusEl.textContent = 'Démo terminée.';
    micLabel.textContent = 'Revenir au début';
    micBtn.disabled = false;
    stopBtn.hidden = true;
    started = false;
    idx = 0;
  }

  // --- Barge-in : l'enfant peut couper Billy à tout moment via "Arrêter" ---
  function stopEverything() {
    clearSilence();
    if (canSpeak) speechSynthesis.cancel();
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    hideFallback();
    setState('idle');
    subtitle.textContent = "D'accord, on s'arrête. Tu peux retrouver un grand en qui tu as confiance.";
    statusEl.textContent = '';
    micLabel.textContent = 'Revenir au début';
    micBtn.disabled = false;
    stopBtn.hidden = true;
    started = false;
    idx = 0;
  }

  // --- Boutons ---
  micBtn.addEventListener('click', () => {
    if (started) return;
    started = true;
    idx = 0;
    micBtn.disabled = true;
    stopBtn.hidden = false;
    if (canSpeak) speechSynthesis.cancel(); // débloque l'audio (geste utilisateur)
    runStep();
  });
  stopBtn.addEventListener('click', stopEverything);

  // --- Info capacités au chargement ---
  if (!canListen && !canSpeak) {
    statusEl.textContent = 'Mode texte (voix non disponible sur ce navigateur).';
  } else if (!canListen) {
    statusEl.textContent = 'Billy parle ; tu réponds au clavier (reconnaissance vocale indispo).';
  }
})();
