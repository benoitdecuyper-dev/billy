/* Sélecteur hybride : le LLM CHOISIT, n'INVENTE jamais. Ces tests prouvent le fail-closed :
 * tout choix hors-menu / hors-lexique / tabou / malformé retombe sur une invitation ouverte sûre.
 * npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chooseNext, buildMenu, finalize, pickChildWord } from './selector.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = JSON.parse(readFileSync(path.resolve(__dirname, '../../public/content/script-billy.json'), 'utf8'));
const OPEN = SCRIPT.selecteur.repli_invitations_ouvertes;
const REASSURE = SCRIPT.selecteur.reassurance_sur_signal;

// llmFn factice : renvoie une décision fixée (sans réseau).
const fixed = (d) => async () => d;

test('buildMenu expose les items de la phase et exclut les réactions (P6)', () => {
  const menu = buildMenu(SCRIPT, 'P4');
  assert.ok(menu.length > 0);
  assert.ok(menu.every((m) => m.type !== 'reaction'));
  const p6 = buildMenu(SCRIPT, 'P6');
  assert.equal(p6.length, 0, 'P6 (révélation) ne doit jamais être offerte au choix libre');
});

test('say sur un id valide → joue la formulation exacte du répertoire', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: [], llmFn: fixed({ action: 'say', phraseId: 'P4-1', signal: 'none' }) });
  assert.equal(out.source, 'repertoire');
  assert.equal(out.text, 'Raconte-moi ce que tu as mangé ce matin.');
  assert.equal(out.expectsChild, true);
});

test('say sur un id HALLUCINÉ (hors menu) → fail-closed sur invitation ouverte', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: [], llmFn: fixed({ action: 'say', phraseId: 'INEXISTANT-999', signal: 'none' }) });
  assert.equal(out.source, 'fallback');
  assert.ok(OPEN.includes(out.text));
});

test("say avec un id d'une AUTRE phase (hors menu courant) → fail-closed", async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P1', childWords: [], llmFn: fixed({ action: 'say', phraseId: 'P7-2', signal: 'none' }) });
  assert.equal(out.source, 'fallback');
});

test('cued_invitation avec un mot DIT par l\'enfant → invitation validée', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: ['dinosaure'], childUtterance: 'mon dinosaure', llmFn: fixed({ action: 'cued_invitation', cuedWord: 'dinosaure', signal: 'none' }) });
  assert.equal(out.source, 'cued');
  assert.equal(out.text, 'Tu as parlé de dinosaure. Raconte-moi ça.');
});

test('cued_invitation avec un mot JAMAIS dit → fail-closed', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: ['dinosaure'], llmFn: fixed({ action: 'cued_invitation', cuedWord: 'voiture', signal: 'none' }) });
  assert.equal(out.source, 'fallback');
});

test('cued_invitation avec un mot TABOU → fail-closed (même si l\'enfant l\'a dit)', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: ['zizi'], childUtterance: 'le zizi', llmFn: fixed({ action: 'cued_invitation', cuedWord: 'zizi', signal: 'none' }) });
  assert.equal(out.source, 'fallback');
});

test('SIGNAL (révélation) → réassurance imposée, clôture P7, aucune investigation', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: [], llmFn: fixed({ action: 'say', phraseId: 'P4-1', signal: 'disclosure' }) });
  assert.equal(out.signal, 'disclosure');
  assert.equal(out.text, REASSURE);
  assert.equal(out.nextPhase, 'P7');
  assert.equal(out.done, true);
  assert.equal(out.expectsChild, false);
});

test('LLM renvoie null → repli déterministe (reprend le mot de l\'enfant)', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: ['toboggan'], childUtterance: 'le toboggan', turnInPhase: 1, llmFn: async () => null });
  assert.equal(out.source, 'cued');
  assert.equal(out.text, 'Tu as parlé de toboggan. Raconte-moi ça.');
});

test('LLM renvoie un objet MALFORMÉ → fail-closed sur invitation ouverte', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: [], llmFn: fixed({ foo: 'bar' }) });
  assert.equal(out.source, 'fallback');
  assert.ok(OPEN.includes(out.text));
});

test('sans LLM ni parole enfant → première invitation de la phase', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P4', childWords: [], turnInPhase: 0, llmFn: null });
  assert.ok(out.text && out.expectsChild);
});

test('nextPhase est conservée à travers finalize (avancement piloté par le sélecteur)', async () => {
  const out = await chooseNext({ script: SCRIPT, phaseId: 'P3', childWords: [], llmFn: fixed({ action: 'say', phraseId: 'P3-1', nextPhase: 'P4', signal: 'none' }) });
  assert.equal(out.nextPhase, 'P4');
});

test('pickChildWord ignore les mots-outils et les mots courts', () => {
  assert.equal(pickChildWord('avec mon chien'), 'chien');
  assert.equal(pickChildWord('le'), null);
});

test('finalize attrape toute exception et renvoie un repli sûr', () => {
  const out = finalize(null, { script: SCRIPT, menu: [], childWords: [] });
  assert.ok(OPEN.includes(out.text));
});
