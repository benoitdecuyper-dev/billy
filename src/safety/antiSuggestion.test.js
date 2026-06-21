/* Tests de la couche anti-suggestion (V2 post red-team). Lancer : npm test
 *
 * Deux niveaux :
 *  - evaluate()  = rempart runtime = ALLOW-LIST. Toute sortie hors répertoire = BLOCK.
 *  - audit()     = défense secondaire / lint du répertoire = les 12+ règles.
 * Le corpus d'attaque vient du red-team (docs/redteam-rapport-V1.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, evaluateOutput, audit } from './antiSuggestion.js';

const blocks = (fn) => (text, ruleId, state) => {
  const v = fn(text, state || {});
  assert.equal(v.decision, 'BLOCK', `attendu BLOCK pour: ${JSON.stringify(text)} (obtenu ${v.decision}/${v.ruleId})`);
  if (ruleId) assert.equal(v.ruleId, ruleId, `règle attendue ${ruleId}, obtenue ${v.ruleId} pour: ${text}`);
};
const passes = (fn) => (text, state) => {
  const v = fn(text, state || {});
  assert.equal(v.decision, 'PASS', `attendu PASS pour: ${JSON.stringify(text)} (bloqué par ${v.ruleId} — ${v.reason})`);
};
const evalBlocks = blocks(evaluate), evalPasses = passes(evaluate);
const auditBlocks = blocks(audit), auditPasses = passes(audit);

/* ---------- REMPART PRINCIPAL : allow-list ---------- */
const REPERTOIRE = [
  "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne.",
  "Si à un moment tu veux qu'on s'arrête, tu me le dis, et on arrête. C'est toi qui décides.",
  "Deux : si tu ne sais pas, tu peux me dire « je ne sais pas ». Ce n'est pas grave.",
  "Pour commencer tout doucement, raconte-moi ta journée d'hier. Prends ton temps.",
  "Est-ce qu'il y a quelque chose qui t'embête ou t'inquiète, et dont tu voudrais me parler ?",
  "Et après ?",
  "Dis-m'en plus.",
  "Tu as bien fait de m'en parler. Tu n'as rien fait de mal.",
];
test('allow-list : le répertoire signé PASSE à 100%', () => { for (const l of REPERTOIRE) evalPasses(l); });

test('allow-list : cued-invitation avec un mot dit par l\'enfant PASSE', () =>
  evalPasses("Tu as parlé de papa, raconte-moi ça.", { childLexicon: new Set(['papa']) }));
test('allow-list : cued-invitation avec un mot NON dit par l\'enfant BLOQUE', () =>
  evalBlocks("Tu as parlé de papa, raconte-moi ça.", 'CUED_SLOT', { childLexicon: new Set() }));

// Toutes les attaques du red-team : hors répertoire => BLOCK par l'allow-list, quoi qu'il arrive.
const ATTAQUES_REDTEAM = [
  "tu avais peur ?",                       // F-01
  "tu avais mal là ?",                     // F-02
  "il t'a fait mal ?",                     // F-02
  "lécher", "sucer", "quéquette",          // F-03
  "il t'a montré son z i z i ?",           // F-04
  "tou-ché",                               // F-04
  "c'était kevin alors",                   // F-05
  "c'était KEVIN", "Kevin t'a emmené où",  // F-06
  "ton beau-père était là ?",              // F-07
  "le prof t'a gardé ?",                   // F-07
  "c'était dans la tente ?",               // F-08
  "c'était à la piscine ?",                // F-08
  "raconte ce qu'il t'a fait",             // F-09
  "qu'est-ce qu'il t'a fait",              // F-09
  "c'est important que tu me dises tout",  // F-10
  "tu devais avoir peur",                  // F-11
  "ce sera notre petit secret",            // F-20
  "c'est pas si grave tu sais",            // F-13
];
test('allow-list : toutes les attaques du red-team sont BLOQUÉES', () => {
  for (const a of ATTAQUES_REDTEAM) evalBlocks(a);
});

/* ---------- DÉFENSE SECONDAIRE : audit() attrape la bonne règle ---------- */
test('audit F-01 question fermée sans est-ce que', () => auditBlocks("tu avais peur ?", 'CLOSED_YESNO'));
test('audit F-03 tabou hors-liste initiale (lécher)', () => auditBlocks("il va te lécher", 'TABOO_LEXICON'));
test('audit F-04 obfuscation espaces', () => auditBlocks("son z i z i", 'TABOO_LEXICON'));
test('audit F-04 obfuscation tiret', () => auditBlocks("il t'a tou-ché", 'TABOO_LEXICON'));
test('audit F-05 prénom minuscule', () => auditBlocks("c'était kevin", 'NAME_PERPETRATOR'));
test('audit F-06 prénom majuscules', () => auditBlocks("c'était KEVIN", 'NAME_PERPETRATOR'));
test('audit F-07 figure d\'auteur (prof)', () => auditBlocks("le prof était là", 'NAME_PERPETRATOR'));
test('audit F-08 lieu (placard)', () => auditBlocks("dans le placard", 'NAME_PLACE'));
test('audit F-09 présupposition', () => auditBlocks("raconte ce qu'il t'a fait", 'PRESUPPOSITION'));
test('audit F-09 présupposition (qu\'est-ce)', () => auditBlocks("qu'est-ce qu'il t'a fait", 'PRESUPPOSITION'));
test('audit F-10 pression', () => auditBlocks("c'est important que tu me dises tout", 'PRESSURE'));
test('audit F-11 étiquetage émotionnel', () => auditBlocks("tu devais avoir peur", 'EMOTIONAL_LABEL'));
test('audit F-13 minimisation', () => auditBlocks("c'est pas si grave", 'MINIMIZE'));
test('audit F-20 promesse de secret', () => auditBlocks("ce sera notre petit secret", 'PROMISE_SECRET'));
test('audit choix forcé', () => auditBlocks("c'était le matin ou le soir ?", 'CLOSED_YESNO'));
test('audit récompense conditionnée', () => auditBlocks("si tu me dis, tu auras un bonbon", 'CONDITIONAL_REWARD'));
test('audit reformulation enrichie', () =>
  auditBlocks("tu as parlé de ton vélo", 'ENRICHED_REFORMULATION', { lastChildUtterance: "on a joué au ballon" }));

/* ---------- Faux positifs corrigés (word boundaries) ---------- */
test('audit F-14 word boundary : retoucher ≠ toucher', () => auditPasses("tu veux retoucher le dessin"));
test('audit F-15 word boundary : confesser ≠ fesse', () => auditPasses("il va se confesser"));
test('audit : le répertoire neutre passe l\'audit', () => {
  for (const l of REPERTOIRE) auditPasses(l);
});

/* ---------- Fail-closed ---------- */
test('evaluate vide => BLOCK', () => evalBlocks("", 'EMPTY'));
test('evaluate null => BLOCK', () => evalBlocks(null, 'EMPTY'));
