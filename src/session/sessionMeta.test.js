/* Tests des métadonnées de séances (BILLY-111). npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSessionMetaList, addSessionMeta } from './sessionMeta.js';

test('addSessionMeta numérote et nettoie', () => {
  let list = addSessionMeta(null, { date: '01/06/2026', debut: '10:00', fin: '10:08', duree: '8 min', signal: false, phases: ['P1', 'P2'] });
  list = addSessionMeta(list, { date: '03/06/2026', debut: '18:00', fin: '18:05', duree: '5 min', signal: true });
  assert.equal(list.length, 2);
  assert.equal(list[0].n, 1);
  assert.equal(list[1].n, 2);
  assert.equal(list[1].signal, true);
  assert.deepEqual(list[1].phases, []);
});

test('assertSessionMetaList rejette tout champ de contenu', () => {
  assert.throws(() => assertSessionMetaList([{ n: 1, signal: false, verbatim: 'papa a dit...' }]), /interdit/);
  assert.throws(() => assertSessionMetaList([{ n: 1, signal: false, emotion: 'peur' }]), /interdit/);
});

test('assertSessionMetaList : signal doit être booléen, n requis', () => {
  assert.throws(() => assertSessionMetaList([{ n: 1, signal: 'oui' }]), /booléen|booleen/);
  assert.throws(() => assertSessionMetaList([{ signal: false }]), /numéro|numero/);
});

test('assertSessionMetaList : pas de contenu déguisé en métadonnée longue', () => {
  const longText = 'x'.repeat(60);
  assert.throws(() => assertSessionMetaList([{ n: 1, signal: false, duree: longText }]), /courte/);
});

test('addSessionMeta écarte les champs interdits passés en entrée', () => {
  const list = addSessionMeta(null, { date: '01/06/2026', signal: false, verbatim: 'secret', emotion: 'triste' });
  assert.equal(list[0].verbatim, undefined);
  assert.equal(list[0].emotion, undefined);
  assertSessionMetaList(list);
});
