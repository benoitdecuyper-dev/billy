/*
 * Générateur PDF des documents Billy. DEUX documents distincts (comme le .docx) :
 *   1) Rapport de séance  = compte rendu FACTUEL (verbatim + récap + signaux).
 *   2) Démarche d'orientation = « que faire » (marche à suivre + rappels).
 * Respecte docs/rapport-de-seance.md : aucune interprétation, qualification, ni auteur désigné.
 *
 * API : writeReportPdf(session, path) / writeDemarchePdf(session, path) -> Promise<path>
 */

import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';

const PINK = '#EC6A9C';
const GREEN = '#2F8A55';
const MUTED = '#7A6F77';
const INK = '#3F3640';

function newDoc(stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);
  return doc;
}
function title(doc, text) {
  doc.font('Helvetica-Bold').fontSize(20).fillColor(PINK).text(text);
  doc.moveDown(0.3);
}
function subtitle(doc, text) {
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED).text(text);
  doc.moveDown(0.8);
}
function heading(doc, text) {
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(text);
  doc.moveTo(doc.x, doc.y + 1).lineTo(doc.page.width - doc.page.margins.right, doc.y + 1).strokeColor(PINK).lineWidth(1.5).stroke();
  doc.moveDown(0.5);
}
function note(doc, text) {
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED).text(text);
  doc.moveDown(0.5);
}
function bullet(doc, text) {
  doc.font('Helvetica').fontSize(10.5).fillColor(INK).text('•  ' + text, { indent: 6 });
  doc.moveDown(0.15);
}
function kv(doc, k, v) {
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(k + ' : ', { continued: true });
  doc.font('Helvetica').fillColor(INK).text(v);
  doc.moveDown(0.1);
}
function footer(doc, text) {
  doc.moveDown(1);
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED).text(text);
}

// ---------- 1) Rapport de séance (factuel) ----------
function renderReport(doc, s) {
  title(doc, 'Rapport de séance — Billy');
  subtitle(doc, "Compte rendu factuel, sans interprétation. Billy n'est pas un outil de diagnostic ni une preuve : ce document rapporte les mots de l'enfant pour être transmis à un professionnel. La marche à suivre figure dans un document séparé.");

  heading(doc, 'Informations');
  kv(doc, 'Date', s.date);
  kv(doc, 'Début / fin', `${s.debut} → ${s.fin}`);
  kv(doc, 'Durée', s.duree);
  kv(doc, 'Enfant (déclaré)', `${s.enfant.prenom}, ${s.enfant.age}`);
  kv(doc, 'Version du script', s.version);

  heading(doc, "Déroulé de l'échange (mot pour mot)");
  for (const t of s.tours) {
    const isChild = t.acteur === 'Enfant';
    doc.fontSize(10.5);
    doc.font('Helvetica').fillColor(MUTED).text(`[${t.heure}] `, { continued: true });
    doc.font('Helvetica-Bold').fillColor(isChild ? GREEN : PINK).text(`${t.acteur} : `, { continued: true });
    doc.font(isChild ? 'Helvetica-Oblique' : 'Helvetica').fillColor(INK).text(isChild ? `« ${t.texte} »` : t.texte);
    doc.moveDown(0.2);
  }

  heading(doc, 'Récapitulatif factuel');
  note(doc, "Reprise des éléments exprimés par l'enfant, dans ses mots, sans rien ajouter ni interpréter.");
  for (const r of s.recap) bullet(doc, r);

  heading(doc, 'Signaux repérés');
  if (s.signaux && s.signaux.length) {
    note(doc, 'Constats factuels, sans score ni conclusion.');
    for (const sig of s.signaux) bullet(doc, sig);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(PINK).text('Un ou plusieurs signaux ont été repérés : voir le document « Démarche à suivre ».');
  } else {
    doc.font('Helvetica').fontSize(10.5).fillColor(INK).text('Aucun signal de danger repéré au cours de cet échange.');
  }

  footer(doc, "Document généré localement. Données sensibles : à transmettre uniquement aux personnes habilitées, puis à supprimer si non nécessaire.");
}

// ---------- 2) Démarche d'orientation ----------
function renderDemarche(doc, s) {
  title(doc, "Que faire — démarche d'orientation");
  subtitle(doc, "À lire par l'adulte. Ce n'est pas un diagnostic : c'est une marche à suivre standard si un risque est identifié.");

  heading(doc, 'Marche à suivre');
  for (const o of s.orientation) {
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(o.niveau + ' — ', { continued: true });
    doc.font('Helvetica').fillColor(INK).text(o.action);
    doc.moveDown(0.2);
  }
  note(doc, "En cas de doute, appelez le 119 : c'est fait pour ça. Le coût d'une fausse alerte est faible ; celui d'un signal manqué est inacceptable.");

  heading(doc, "Rappels pour l'adulte");
  for (const r of [
    "Croire l'enfant et le lui dire ; le déculpabiliser (« ce n'est pas ta faute »).",
    "Ne pas confronter la personne soupçonnée. Ne pas faire répéter l'enfant.",
    "Ne pas mener soi-même l'interrogatoire : transmettre le rapport de séance à un professionnel.",
    "Ne pas promettre le secret. Ne pas rester seul : 119, médecin, services de protection de l'enfance.",
  ]) bullet(doc, r);

  footer(doc, "Numéros : 119 (enfance en danger, 24/7, gratuit) · 17/112 (danger immédiat) · 15/18 (urgence médicale) · 3018 (cyberviolences).");
}

function write(render, session, path) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path);
    const doc = newDoc(stream);
    render(doc, session);
    doc.end();
    stream.on('finish', () => resolve(path));
    stream.on('error', reject);
  });
}

export const writeReportPdf = (session, path) => write(renderReport, session, path);
export const writeDemarchePdf = (session, path) => write(renderDemarche, session, path);
