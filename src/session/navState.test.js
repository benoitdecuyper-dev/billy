/* Tests de la continuité silencieuse (BILLY-E15). npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState, assertNoContent, advance, complete,
  markSignal, recordNeutralTopic, planReturnSession,
} from './navState.js';

test('état vide = navigation nulle, aucun contenu', () => {
  const s = emptyState();
  assert.deepEqual(
    Object.keys(s).sort(),
    ['completedPhases', 'lastSessionTs', 'phaseId', 'sessionsCount', 'signalEmitted', 'usedNeutralTopics'],
  );
  assertNoContent(s);
});

test('assertNoContent rejette toute clé de contenu', () => {
  assert.throws(() => assertNoContent({ phaseId: 'P3', verbatim: 'papa a dit...' }), /contenu/);
  assert.throws(() => assertNoContent({ phaseId: 'P3', emotion: 'peur' }), /interdite/);
});

test('phaseId doit être un identifiant de navigation, pas du contenu', () => {
  assert.throws(() => assertNoContent({ ...emptyState(), phaseId: { texte: 'x' } }), /navigation/);
  // une phrase (avec espaces) n'est pas un identifiant de navigation
  assert.throws(() => assertNoContent({ ...emptyState(), phaseId: 'papa a dit quelque chose' }), /navigation/);
});

test('completedPhases / usedNeutralTopics ne peuvent contenir que des identifiants', () => {
  assert.throws(() => assertNoContent({ ...emptyState(), completedPhases: ['il a parle de son secret'] }), /identifiants/);
  assert.throws(() => assertNoContent({ ...emptyState(), usedNeutralTopics: [{ texte: 'x' }] }), /identifiants/);
});

test('signalEmitted doit être un booléen', () => {
  assert.throws(() => assertNoContent({ ...emptyState(), signalEmitted: 'oui' }), /booleen|booléen/);
});

test('advance ne garde que la navigation et trace la phase', () => {
  const s = advance(emptyState(), 'P4', 1000);
  assert.equal(s.phaseId, 'P4');
  assert.equal(s.lastSessionTs, 1000);
  assert.deepEqual(s.completedPhases, ['P4']);
  assertNoContent(s);
});

test('complete incrémente le compteur et remet la navigation à zéro', () => {
  const s = complete(advance(emptyState(), 'P5', 1000), 2000);
  assert.equal(s.phaseId, null);
  assert.equal(s.sessionsCount, 1);
  assert.deepEqual(s.completedPhases, []);
  assertNoContent(s);
});

test('markSignal est irréversible et reste après une nouvelle séance', () => {
  let s = markSignal(emptyState());
  assert.equal(s.signalEmitted, true);
  s = complete(advance(s, 'P6', 1000), 2000);
  assert.equal(s.signalEmitted, true);
  assertNoContent(s);
});

test('BILLY-105 — 1ʳᵉ séance : parcours complet', () => {
  const plan = planReturnSession(emptyState(), ['t1', 't2']);
  assert.equal(plan.mode, 'first');
  assert.equal(plan.openingLocked, false);
});

test('BILLY-105 — séance de retour : sujet neutre différent, P5 conservé', () => {
  let s = complete(recordNeutralTopic(emptyState(), 't1'), 1000); // séance 1 a utilisé t1
  const plan = planReturnSession(s, ['t1', 't2', 't3']);
  assert.equal(plan.mode, 'return');
  assert.notEqual(plan.neutralTopicId, 't1'); // jamais le même sujet neutre
  assert.ok(plan.steps.includes('P5'));
  assert.equal(plan.openingLocked, false);
});

test('BILLY-106 — mode post-signal : P5 verrouillée, orientation renforcée', () => {
  let s = complete(markSignal(emptyState()), 1000);
  const plan = planReturnSession(s, ['t1', 't2']);
  assert.equal(plan.mode, 'post-signal');
  assert.equal(plan.openingLocked, true);
  assert.ok(!plan.steps.includes('P5')); // jamais de réouverture
  assert.ok(plan.steps.includes('orientation-reinforced'));
});

/* --- Durcissements audit/red-team --- */
test('P3 — phaseId hors allow-list rejeté (contenu déguisé en id)', () => {
  assert.throws(() => assertNoContent({ ...emptyState(), phaseId: 'iltouchezizi' }), /navigation/);
  assert.throws(() => assertNoContent({ ...emptyState(), completedPhases: ['iltouchezizi'] }), /identifiants/);
});

test('P3 — usedNeutralTopics : un mot-phrase concaténé est rejeté', () => {
  assert.throws(() => assertNoContent({ ...emptyState(), usedNeutralTopics: ['papamatouche'] }), /catalogue|identifiants/);
  // un vrai id de catalogue (avec chiffre) passe
  assertNoContent({ ...emptyState(), usedNeutralTopics: ['t1', 'sujet-2'] });
});

test('C3 — une string longue sous une clé numérique est rejetée', () => {
  assert.throws(() => assertNoContent({ ...emptyState(), lastSessionTs: 'papa m\'a fait quelque chose' }), /nombre/);
  assert.throws(() => assertNoContent({ ...emptyState(), sessionsCount: 'verbatim' }), /nombre/);
});

test('Red-team P4 — tous les sujets neutres utilisés : on SAUTE P4 (pas de rejeu)', () => {
  let s = recordNeutralTopic(recordNeutralTopic(emptyState(), 't1'), 't2');
  s = complete(s, 1000);
  const plan = planReturnSession(s, ['t1', 't2']);
  assert.equal(plan.mode, 'return');
  assert.equal(plan.neutralTopicId, null);
  assert.ok(!plan.steps.includes('P4-neutral'));
});
