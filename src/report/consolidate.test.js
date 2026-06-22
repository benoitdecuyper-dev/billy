/* Tests du rapport consolidé multi-sessions (BILLY-112 / BILLY-113). npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stat, rm } from 'node:fs/promises';
import { buildConsolidated, assertReportPerimeter } from './consolidate.js';
import { writeConsolidatedPdf } from './generatePdf.js';

const S1 = {
  date: '01/06/2026', debut: '10:00', fin: '10:08', duree: '8 min',
  enfant: { prenom: 'Léa', age: '4 ans' }, version: '1.0', phases: ['P1', 'P2', 'P3', 'P4', 'P5'],
  tours: [
    { heure: '10:01', acteur: 'Billy', texte: 'Raconte-moi.' },
    { heure: '10:02', acteur: 'Enfant', texte: 'le chien a couru dans le jardin' },
  ],
  signaux: [],
};
const S2 = {
  date: '03/06/2026', debut: '18:00', fin: '18:05', duree: '5 min',
  enfant: { prenom: 'Léa', age: '4 ans' }, version: '1.0', phases: ['P3', 'P4', 'P5'],
  tours: [
    { heure: '18:01', acteur: 'Billy', texte: 'Et après ?' },
    { heure: '18:02', acteur: 'Enfant', texte: 'j ai mange une pomme' },
  ],
  signaux: ['Pleurs au moment de parler du soir.'],
};

test('BILLY-112 : chaque séance est un bloc séparé et daté', () => {
  const c = buildConsolidated([S1, S2]);
  assert.equal(c.nombreSessions, 2);
  assert.deepEqual(c.periode, { debut: '01/06/2026', fin: '03/06/2026' });
  assert.equal(c.sessions[0].numero, 1);
  assert.equal(c.sessions[1].numero, 2);
  assert.deepEqual(c.sessions[1].phases, ['P3', 'P4', 'P5']);
});

test('BILLY-112 : le verbatim d\'une séance ne réapparaît pas dans une autre', () => {
  const c = buildConsolidated([S1, S2]);
  const bloc2 = JSON.stringify(c.sessions[1]);
  const bloc1 = JSON.stringify(c.sessions[0]);
  assert.ok(bloc1.includes('chien'), 'le verbatim S1 est dans le bloc 1');
  assert.ok(!bloc2.includes('chien'), 'le verbatim S1 ne fuit PAS dans le bloc 2');
  assert.ok(bloc2.includes('pomme'));
});

test('BILLY-112 : récap consolidé = signaux par session, sans fusion ni conclusion', () => {
  const c = buildConsolidated([S1, S2]);
  assert.deepEqual(c.recapitulatif.signauxParSession, [{ session: 2, signaux: ['Pleurs au moment de parler du soir.'] }]);
  assert.match(c.recapitulatif.niveauGlobal, /repérés/);
  // pas de résumé en langage naturel inter-sessions
  assert.equal(c.recapitulatif.synthese, undefined);
  assert.equal(c.recapitulatif.resume, undefined);
});

test('BILLY-112 : aucun signal => niveau global neutre', () => {
  const c = buildConsolidated([S1]);
  assert.deepEqual(c.recapitulatif.signauxParSession, []);
  assert.match(c.recapitulatif.niveauGlobal, /[Aa]ucun signal/);
});

test('BILLY-112 : liste vide => erreur', () => {
  assert.throws(() => buildConsolidated([]), /aucune séance/);
});

test('BILLY-113 : un champ analytique/émotionnel est REFUSÉ', () => {
  assert.throws(() => assertReportPerimeter({ sessions: [{ emotion: 'peur' }] }), /périmètre RGPD/);
  assert.throws(() => assertReportPerimeter({ x: { hesitation: 3 } }), /périmètre RGPD/);
  assert.throws(() => assertReportPerimeter({ profil: {} }), /périmètre RGPD/);
  assert.throws(() => assertReportPerimeter({ recapitulatif: { synthese: 'x' } }), /périmètre RGPD/);
});

test('BILLY-113 : aucune donnée d\'identification de l\'enfant au-delà de prénom/âge', () => {
  assert.throws(() => assertReportPerimeter({ enfant: { prenom: 'Léa', age: '4', nom: 'Martin' } }), /identification/);
  assert.throws(() => assertReportPerimeter({ enfant: { prenom: 'Léa', adresse: 'x' } }), /identification/);
});

test('BILLY-113 : minimisation par construction (champs analytiques en entrée écartés)', () => {
  const sale = { ...S1, enfant: { prenom: 'Léa', age: '4 ans', nom: 'Martin' },
    tours: [{ heure: '10:01', acteur: 'Enfant', texte: 'coucou', hesitation: 2, vitesse: 'lente' }] };
  const c = buildConsolidated([sale]); // ne doit pas lever : on reconstruit sans les champs interdits
  assert.equal(c.enfant.nom, undefined);
  assert.equal(c.sessions[0].tours[0].hesitation, undefined);
  assert.equal(c.sessions[0].tours[0].vitesse, undefined);
  assertReportPerimeter(c); // le résultat reste dans le périmètre
});

test('É1 : prototype pollution rejetée (entrée réseau)', () => {
  assert.throws(() => assertReportPerimeter(JSON.parse('{"__proto__":{"x":1}}')), /interdite/);
  assert.throws(() => assertReportPerimeter(JSON.parse('{"constructor":1}')), /interdite/);
});

test('BILLY-112 : export PDF consolidé produit un fichier non vide', async () => {
  const p = join(tmpdir(), `billy-consolide-test-${process.pid}.pdf`);
  await writeConsolidatedPdf(buildConsolidated([S1, S2]), p);
  const st = await stat(p);
  assert.ok(st.size > 500, 'le PDF consolidé a une taille plausible');
  await rm(p, { force: true });
});
