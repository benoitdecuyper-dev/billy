/* Tests de la continuité silencieuse (BILLY-E15). npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, assertNoContent, advance, complete } from './navState.js';

test('état vide = navigation nulle, aucun contenu', () => {
  const s = emptyState();
  assert.deepEqual(Object.keys(s).sort(), ['lastSessionTs', 'phaseId', 'sessionsCount']);
  assertNoContent(s);
});

test('assertNoContent rejette toute clé de contenu', () => {
  assert.throws(() => assertNoContent({ phaseId: 'P3', verbatim: 'papa a dit...' }), /contenu/);
  assert.throws(() => assertNoContent({ phaseId: 'P3', emotion: 'peur' }), /interdite/);
});

test('phaseId doit être un identifiant de navigation, pas du contenu', () => {
  assert.throws(() => assertNoContent({ phaseId: { texte: 'x' }, lastSessionTs: 0, sessionsCount: 0 }), /navigation/);
});

test('advance ne garde que la navigation', () => {
  const s = advance(emptyState(), 'P4', 1000);
  assert.equal(s.phaseId, 'P4');
  assert.equal(s.lastSessionTs, 1000);
  assertNoContent(s);
});

test('complete incrémente le compteur et remet la navigation à zéro', () => {
  const s = complete(advance(emptyState(), 'P5', 1000), 2000);
  assert.equal(s.phaseId, null);
  assert.equal(s.sessionsCount, 1);
  assertNoContent(s);
});
