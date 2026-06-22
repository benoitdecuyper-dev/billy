/* Tests de la persistance locale chiffrée (BILLY-104). npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveState, loadState, purge, STORAGE_KEY } from './secureStore.js';
import { advance, markSignal, emptyState } from './navState.js';

// Storage minimal en mémoire (équivalent localStorage pour les tests).
function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
    _raw: m,
  };
}

const CODE = '1234';

test('BILLY-104 : aller-retour chiffré conserve l\'état de navigation', async () => {
  const st = memStorage();
  const state = markSignal(advance(emptyState(), 'P4', 1000));
  await saveState(st, CODE, state);
  const loaded = await loadState(st, CODE);
  assert.equal(loaded.phaseId, 'P4');
  assert.equal(loaded.signalEmitted, true);
  assert.deepEqual(loaded.completedPhases, ['P4']);
});

test('BILLY-104 : le store ne contient AUCUNE donnée en clair (chiffré au repos)', async () => {
  const st = memStorage();
  await saveState(st, CODE, advance(emptyState(), 'P4', 1000));
  const blob = st.getItem(STORAGE_KEY);
  assert.ok(!blob.includes('P4'), 'aucun identifiant de phase en clair');
  assert.ok(!blob.includes('phaseId'), 'aucune clé de l\'état en clair');
  // structure attendue : sel + iv + cipher, rien d'autre
  assert.deepEqual(Object.keys(JSON.parse(blob)).sort(), ['ct', 'iv', 'salt', 'v']);
});

test('BILLY-104 : refus de persister du contenu (périmètre §4.1, fail-closed)', async () => {
  const st = memStorage();
  await assert.rejects(saveState(st, CODE, { phaseId: 'P4', verbatim: 'papa a dit...' }), /contenu/);
  assert.equal(st.getItem(STORAGE_KEY), null, 'rien n\'a été écrit');
});

test('BILLY-104 : code parental erroné => déchiffrement refusé (fail-closed)', async () => {
  const st = memStorage();
  await saveState(st, CODE, advance(emptyState(), 'P5', 1000));
  await assert.rejects(loadState(st, '9999'), /déchiffrement impossible/);
});

test('BILLY-104 : code parental trop court refusé', async () => {
  const st = memStorage();
  await assert.rejects(saveState(st, '12', emptyState()), /code parental/);
});

test('BILLY-104 : purge rend les données irrécupérables', async () => {
  const st = memStorage();
  await saveState(st, CODE, advance(emptyState(), 'P3', 1000));
  purge(st);
  assert.equal(st.getItem(STORAGE_KEY), null);
  assert.equal(await loadState(st, CODE), null);
});

test('BILLY-104 : chargement sans dossier => null', async () => {
  assert.equal(await loadState(memStorage(), CODE), null);
});
