/* Tests de la couche anti-suggestion. Lancer : npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './antiSuggestion.js';

function blocks(text, ruleId, state) {
  const v = evaluate(text, state || {});
  assert.equal(v.decision, 'BLOCK', `attendu BLOCK pour: ${text} (obtenu ${v.decision}/${v.ruleId})`);
  if (ruleId) assert.equal(v.ruleId, ruleId, `règle attendue ${ruleId}, obtenue ${v.ruleId} pour: ${text}`);
}
function passes(text, state) {
  const v = evaluate(text, state || {});
  assert.equal(v.decision, 'PASS', `attendu PASS pour: ${text} (bloqué par ${v.ruleId} — ${v.reason})`);
}

// --- Un contre-exemple bloquant par règle ---
test('1 TABOO_LEXICON', () => blocks("il t'a touché le zizi ?", 'TABOO_LEXICON'));
test('2 NAME_PERPETRATOR (rôle)', () => blocks("est-ce que papa était là", 'NAME_PERPETRATOR'));
test('2 NAME_PERPETRATOR (prénom)', () => blocks("c'était Kevin alors", 'NAME_PERPETRATOR'));
test('3 NAME_PLACE', () => blocks("tu étais dans la chambre", 'NAME_PLACE'));
test('4 CLOSED_YESNO (est-ce que)', () => blocks("est-ce que tu avais froid ?", 'CLOSED_YESNO'));
test('4 CLOSED_YESNO (inversion)', () => blocks("avais-tu froid ?", 'CLOSED_YESNO'));
test('5 SUGGESTIVE_TAG', () => blocks("tu jouais dehors, c'est bien ça ?", 'SUGGESTIVE_TAG'));
test('6 PRESUPPOSITION', () => blocks("quand il t'a emmené, où alliez-vous", 'PRESUPPOSITION'));
test('7 FORCED_CHOICE', () => blocks("c'était le matin ou le soir ?", 'FORCED_CHOICE'));
test('8 PRESSURE', () => blocks("tu es sûr de ça", 'PRESSURE'));
test('9 REPEAT_QUESTION', () => blocks("raconte-moi encore", 'REPEAT_QUESTION', { askedQuestions: ["Raconte-moi encore"] }));
test('10 CONDITIONAL_REWARD', () => blocks("si tu me dis, tu auras un bonbon", 'CONDITIONAL_REWARD'));
test('11 ENRICHED_REFORMULATION', () =>
  blocks("tu as parlé de ton vélo", 'ENRICHED_REFORMULATION', { lastChildUtterance: "on a joué au ballon" }));
test('12 EMOTIONAL_LABEL', () => blocks("ça a dû te faire très peur", 'EMOTIONAL_LABEL'));

// --- Le répertoire NEUTRE doit passer à 100 % ---
const REPERTOIRE = [
  "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne.",
  "Je suis là juste pour t'écouter. Ici, tu peux parler avec tes mots à toi. Il n'y a pas de bonne ou de mauvaise réponse.",
  "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides.",
  "Avant de commencer, trois petites choses. Un : si je me trompe, tu peux me corriger.",
  "Deux : si tu ne sais pas, tu peux me dire « je ne sais pas ». Ce n'est pas grave.",
  "Trois : on parle seulement de ce qui s'est vraiment passé. On ne devine pas.",
  "Pour commencer tout doucement, raconte-moi ta journée d'hier. Prends ton temps.",
  "Et après ?",
  "Dis-m'en plus.",
  "Prends ton temps. Je t'écoute.",
  "Merci de m'avoir raconté tout ça. C'était chouette de t'écouter.",
  "Tu as bien fait de m'en parler. Tu n'as rien fait de mal.",
];
test('répertoire neutre — 100% PASS', () => {
  for (const line of REPERTOIRE) passes(line);
});

// --- Le lexique de l'enfant débloque les cued invitations légitimes ---
test('cued invitation sur un mot dit par l\'enfant — PASS', () => {
  const state = { childLexicon: new Set(['papa', 'ballon']), lastChildUtterance: "papa a pris le ballon" };
  passes("tu as parlé de papa, raconte", state);
});

// --- Fail-closed ---
test('texte vide => BLOCK', () => blocks("", 'ERROR'));
test('non-string => BLOCK', () => blocks(null, 'ERROR'));
