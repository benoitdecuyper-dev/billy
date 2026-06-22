/* Tests de la persistance locale chiffrée (BILLY-104). npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveState, loadState, purge, purgeAll, saveSessions, loadSessions, STORAGE_KEY, SESSIONS_KEY } from './secureStore.js';
import { advance, markSignal, emptyState } from './navState.js';
import { addSessionMeta } from './sessionMeta.js';

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

const CODE = '123456';

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
  // structure attendue : sel + iv + cipher + horodatage de conservation, rien d'autre
  assert.deepEqual(Object.keys(JSON.parse(blob)).sort(), ['ct', 'iv', 'salt', 'savedAt', 'v']);
});

test('BILLY-104 : refus de persister du contenu (périmètre §4.1, fail-closed)', async () => {
  const st = memStorage();
  await assert.rejects(saveState(st, CODE, { phaseId: 'P4', verbatim: 'papa a dit...' }), /contenu/);
  assert.equal(st.getItem(STORAGE_KEY), null, 'rien n\'a été écrit');
});

test('BILLY-104 : code parental erroné => déchiffrement refusé (fail-closed)', async () => {
  const st = memStorage();
  await saveState(st, CODE, advance(emptyState(), 'P5', 1000));
  await assert.rejects(loadState(st, '999999'), /déchiffrement impossible/);
});

test('BILLY-104 : code parental trop court refusé', async () => {
  const st = memStorage();
  await assert.rejects(saveState(st, '12345', emptyState()), /code parental/);
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

test('BILLY-111 : métadonnées de séances chiffrées (aller-retour, rien en clair)', async () => {
  const st = memStorage();
  let list = addSessionMeta(null, { date: '01/06/2026', debut: '10:00', fin: '10:08', duree: '8 min', signal: false });
  list = addSessionMeta(list, { date: '03/06/2026', debut: '18:00', fin: '18:05', duree: '5 min', signal: true });
  await saveSessions(st, CODE, list);
  const blob = st.getItem(SESSIONS_KEY);
  assert.ok(!blob.includes('01/06/2026'), 'aucune date en clair');
  const loaded = await loadSessions(st, CODE);
  assert.equal(loaded.length, 2);
  assert.equal(loaded[1].signal, true);
});

test('BILLY-111 : refus de persister du contenu dans les métadonnées', async () => {
  const st = memStorage();
  await assert.rejects(saveSessions(st, CODE, [{ n: 1, signal: false, verbatim: 'papa...' }]), /interdit/);
});

test('F3 : purge automatique au-delà de 30 jours', async () => {
  const st = memStorage();
  await saveSessions(st, CODE, addSessionMeta(null, { date: '01/06/2026', signal: false }));
  // on vieillit artificiellement le blob (40 jours)
  const blob = JSON.parse(st.getItem(SESSIONS_KEY));
  blob.savedAt = Date.now() - 40 * 24 * 60 * 60 * 1000;
  st.setItem(SESSIONS_KEY, JSON.stringify(blob));
  assert.equal(await loadSessions(st, CODE), null, 'données expirées => null');
  assert.equal(st.getItem(SESSIONS_KEY), null, 'blob expiré purgé');
});

test('BILLY-111 : purgeAll efface état ET séances', async () => {
  const st = memStorage();
  await saveState(st, CODE, advance(emptyState(), 'P3', 1000));
  await saveSessions(st, CODE, addSessionMeta(null, { date: '01/06/2026', signal: false }));
  purgeAll(st);
  assert.equal(st.getItem(STORAGE_KEY), null);
  assert.equal(st.getItem(SESSIONS_KEY), null);
  assert.equal(await loadSessions(st, CODE), null);
});
