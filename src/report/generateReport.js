/*
 * Générateur du Rapport de séance Billy au format .docx.
 * Respecte docs/rapport-de-seance.md : verbatim horodaté + récap factuel + signaux (sans score)
 * + démarche d'orientation. AUCUNE interprétation, qualification, ni désignation d'auteur.
 *
 * API : buildReportDoc(session) -> Document ; writeReportDocx(session, path) -> écrit le .docx
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';
import { writeFile } from 'node:fs/promises';

const PINK = 'EC6A9C';
const MUTED = '7A6F77';

const para = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 }, ...(opts.par || {}) });
const note = (text) => new Paragraph({ children: [new TextRun({ text, italics: true, color: MUTED, size: 18 })], spacing: { after: 160 } });

function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => new TableRow({
      children: [
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [para(k, { bold: true, size: 20 })] }),
        new TableCell({ children: [para(v, { size: 20 })] }),
      ],
    })),
  });
}

function orientationTable(orientation) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [
        new TableCell({ shading: { fill: PINK }, children: [para('Situation', { bold: true, color: 'FFFFFF', size: 20 })] }),
        new TableCell({ shading: { fill: PINK }, children: [para('Que faire', { bold: true, color: 'FFFFFF', size: 20 })] }),
      ] }),
      ...orientation.map((o) => new TableRow({ children: [
        new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [para(o.niveau, { bold: true, size: 20 })] }),
        new TableCell({ children: [para(o.action, { size: 20 })] }),
      ] })),
    ],
  });
}

export function buildReportDoc(s) {
  const children = [];

  children.push(new Paragraph({ children: [new TextRun({ text: 'Rapport de séance — Billy', bold: true, size: 36, color: PINK })], spacing: { after: 80 } }));
  children.push(note('Compte rendu factuel, sans interprétation. Billy n’est pas un outil de diagnostic ni une preuve : ce document rapporte les mots de l’enfant pour être transmis à un professionnel.'));

  // En-tête
  children.push(new Paragraph({ text: 'Informations', heading: HeadingLevel.HEADING_2 }));
  children.push(infoTable([
    ['Date', s.date],
    ['Début / fin', `${s.debut} → ${s.fin}`],
    ['Durée', s.duree],
    ['Enfant (déclaré)', `${s.enfant.prenom}, ${s.enfant.age}`],
    ['Version du script', s.version],
  ]));

  // Déroulé verbatim
  children.push(new Paragraph({ text: 'Déroulé de l’échange (mot pour mot)', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  for (const t of s.tours) {
    const isChild = t.acteur === 'Enfant';
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `[${t.heure}] `, color: MUTED, size: 18 }),
        new TextRun({ text: `${t.acteur} : `, bold: true, color: isChild ? '2F8A55' : PINK, size: 20 }),
        new TextRun({ text: isChild ? `« ${t.texte} »` : t.texte, italics: isChild, size: 20 }),
      ],
    }));
  }

  // Récap factuel
  children.push(new Paragraph({ text: 'Récapitulatif factuel', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  children.push(note('Reprise des éléments exprimés par l’enfant, dans ses mots, sans rien ajouter ni interpréter.'));
  for (const r of s.recap) children.push(new Paragraph({ text: r, bullet: { level: 0 }, spacing: { after: 60 } }));

  // Signaux
  children.push(new Paragraph({ text: 'Signaux repérés', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  if (s.signaux && s.signaux.length) {
    children.push(note('Constats factuels, sans score ni conclusion.'));
    for (const sig of s.signaux) children.push(new Paragraph({ text: sig, bullet: { level: 0 }, spacing: { after: 60 } }));
  } else {
    children.push(para('Aucun signal de danger repéré au cours de cet échange.', { size: 20 }));
    children.push(note('S’il y avait eu un signal (peur d’une personne, douleur, « secret », détresse…), il aurait été listé ici et la démarche ci-dessous serait à enclencher.'));
  }

  // Démarche
  children.push(new Paragraph({ text: 'Démarche à suivre si un risque est identifié', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  children.push(orientationTable(s.orientation));
  children.push(note('En cas de doute, appelez le 119 : c’est fait pour ça. Le coût d’une fausse alerte est faible ; celui d’un signal manqué est inacceptable.'));

  // Rappels posture
  children.push(new Paragraph({ text: 'Rappels pour l’adulte', heading: HeadingLevel.HEADING_2, spacing: { before: 240 } }));
  for (const r of [
    'Croire l’enfant et le lui dire ; le déculpabiliser (« ce n’est pas ta faute »).',
    'Ne pas confronter la personne soupçonnée. Ne pas faire répéter l’enfant.',
    'Ne pas mener soi-même l’interrogatoire : transmettre ce compte rendu à un professionnel.',
    'Ne pas rester seul : 119, médecin, services de protection de l’enfance.',
  ]) children.push(new Paragraph({ text: r, bullet: { level: 0 }, spacing: { after: 60 } }));

  children.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: 'Document généré localement. Données sensibles : à transmettre uniquement aux personnes habilitées, puis à supprimer si non nécessaire.', italics: true, color: MUTED, size: 16 })] }));

  return new Document({ sections: [{ properties: {}, children }] });
}

export async function writeReportDocx(session, path) {
  const buf = await Packer.toBuffer(buildReportDoc(session));
  await writeFile(path, buf);
  return path;
}
