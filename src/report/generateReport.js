/*
 * Générateur des documents Billy au format .docx. DEUX documents distincts :
 *   1) Rapport de séance  = compte rendu FACTUEL (verbatim + récap + signaux) à transmettre.
 *   2) Démarche d'orientation = « que faire » (marche à suivre + rappels) pour l'adulte.
 *
 * Respecte docs/rapport-de-seance.md : AUCUNE interprétation, qualification, ni auteur désigné.
 *
 * API :
 *   buildReportDoc(session)   / writeReportDocx(session, path)
 *   buildDemarcheDoc(session) / writeDemarcheDocx(session, path)
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType,
} from 'docx';
import { writeFile } from 'node:fs/promises';

const PINK = 'EC6A9C';
const MUTED = '7A6F77';

const para = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
const note = (text) => new Paragraph({ children: [new TextRun({ text, italics: true, color: MUTED, size: 18 })], spacing: { after: 160 } });
const bullet = (text) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
const title = (text) => new Paragraph({ children: [new TextRun({ text, bold: true, size: 36, color: PINK })], spacing: { after: 80 } });

function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => new TableRow({ children: [
      new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [para(k, { bold: true, size: 20 })] }),
      new TableCell({ children: [para(v, { size: 20 })] }),
    ] })),
  });
}

// ---------- 1) Rapport de séance (factuel) ----------
export function buildReportDoc(s) {
  const children = [];
  children.push(title('Rapport de séance — Billy'));
  children.push(note('Compte rendu factuel, sans interprétation. Billy n’est pas un outil de diagnostic ni une preuve : ce document rapporte les mots de l’enfant pour être transmis à un professionnel. La marche à suivre figure dans un document séparé.'));

  children.push(new Paragraph({ text: 'Informations', heading: HeadingLevel.HEADING_2 }));
  children.push(infoTable([
    ['Date', s.date],
    ['Début / fin', `${s.debut} → ${s.fin}`],
    ['Durée', s.duree],
    ['Enfant (déclaré)', `${s.enfant.prenom}, ${s.enfant.age}`],
    ['Version du script', s.version],
  ]));

  children.push(new Paragraph({ text: 'Déroulé de l’échange (mot pour mot)', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  for (const t of s.tours) {
    const isChild = t.acteur === 'Enfant';
    children.push(new Paragraph({ spacing: { after: 80 }, children: [
      new TextRun({ text: `[${t.heure}] `, color: MUTED, size: 18 }),
      new TextRun({ text: `${t.acteur} : `, bold: true, color: isChild ? '2F8A55' : PINK, size: 20 }),
      new TextRun({ text: isChild ? `« ${t.texte} »` : t.texte, italics: isChild, size: 20 }),
    ] }));
  }

  children.push(new Paragraph({ text: 'Récapitulatif factuel', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  children.push(note('Reprise des éléments exprimés par l’enfant, dans ses mots, sans rien ajouter ni interpréter.'));
  for (const r of s.recap) children.push(bullet(r));

  children.push(new Paragraph({ text: 'Signaux repérés', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  if (s.signaux && s.signaux.length) {
    children.push(note('Constats factuels, sans score ni conclusion.'));
    for (const sig of s.signaux) children.push(bullet(sig));
    children.push(para('➡️ Un ou plusieurs signaux ont été repérés : voir le document « Démarche à suivre ».', { bold: true, size: 20, color: PINK }));
  } else {
    children.push(para('Aucun signal de danger repéré au cours de cet échange.', { size: 20 }));
  }

  children.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: 'Document généré localement. Données sensibles : à transmettre uniquement aux personnes habilitées, puis à supprimer si non nécessaire.', italics: true, color: MUTED, size: 16 })] }));
  return new Document({ sections: [{ properties: {}, children }] });
}

// ---------- 2) Démarche d'orientation (que faire) ----------
export function buildDemarcheDoc(s) {
  const children = [];
  children.push(title('Que faire — démarche d’orientation'));
  children.push(note('À lire par l’adulte. Ce n’est pas un diagnostic : c’est une marche à suivre standard si un risque est identifié.'));

  children.push(new Paragraph({ text: 'Marche à suivre', heading: HeadingLevel.HEADING_2 }));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [
        new TableCell({ shading: { fill: PINK }, children: [para('Situation', { bold: true, color: 'FFFFFF', size: 20 })] }),
        new TableCell({ shading: { fill: PINK }, children: [para('Que faire', { bold: true, color: 'FFFFFF', size: 20 })] }),
      ] }),
      ...s.orientation.map((o) => new TableRow({ children: [
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [para(o.niveau, { bold: true, size: 20 })] }),
        new TableCell({ children: [para(o.action, { size: 20 })] }),
      ] })),
    ],
  }));
  children.push(note('En cas de doute, appelez le 119 : c’est fait pour ça. Le coût d’une fausse alerte est faible ; celui d’un signal manqué est inacceptable.'));

  children.push(new Paragraph({ text: 'Rappels pour l’adulte', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  for (const r of [
    'Croire l’enfant et le lui dire ; le déculpabiliser (« ce n’est pas ta faute »).',
    'Ne pas confronter la personne soupçonnée. Ne pas faire répéter l’enfant.',
    'Ne pas mener soi-même l’interrogatoire : transmettre le rapport de séance à un professionnel.',
    'Ne pas promettre le secret. Ne pas rester seul : 119, médecin, services de protection de l’enfance.',
  ]) children.push(bullet(r));

  children.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: 'Numéros : 119 (enfance en danger, 24/7, gratuit) · 17/112 (danger immédiat) · 15/18 (urgence médicale) · 3018 (cyberviolences).', italics: true, color: MUTED, size: 16 })] }));
  return new Document({ sections: [{ properties: {}, children }] });
}

export async function writeReportDocx(session, path) {
  await writeFile(path, await Packer.toBuffer(buildReportDoc(session)));
  return path;
}
export async function writeDemarcheDocx(session, path) {
  await writeFile(path, await Packer.toBuffer(buildDemarcheDoc(session)));
  return path;
}
