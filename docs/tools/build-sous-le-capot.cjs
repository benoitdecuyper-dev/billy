/* Génère le PDF « Billy — Sous le capot » à partir du Markdown docs/00-SOUS-LE-CAPOT.md.
   Usage  : node docs/tools/build-sous-le-capot.cjs
   Sortie : docs/Billy-sous-le-capot.pdf
   Style repris EXACTEMENT de build-dossier-pro.cjs (palette C, marge M=56, polices Arial
   embarquées sous Body/Body-Bold/Body-Italic + repli Helvetica, helpers need, gap, rule, h1..h3, p, etc.). */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const SRC = path.join(__dirname, '..', '00-SOUS-LE-CAPOT.md');
const OUT = path.join(__dirname, '..', 'Billy-sous-le-capot.pdf');

const C = {
  brand: '#b35a00', ink: '#1f2328', mute: '#5a6168', danger: '#b42318',
  boxWarn: '#fff6e9', boxWarnLine: '#d8a657', boxDanger: '#fdeaea', boxDangerLine: '#d64545',
  boxOk: '#eef6ee', boxOkLine: '#3f8f4f', rule: '#dfe2e6',
  code: '#f3f4f6', codeLine: '#dfe2e6', codeInk: '#23272e',
};
const M = 56;
const doc = new PDFDocument({ size: 'A4', margins: { top: M, bottom: M, left: M, right: M }, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

// Police Unicode embarquée (Arial) sous Body* → vrais glyphes (→, ≥, •, ✅…).
// Repli propre sur les polices standard si Arial est introuvable (autre machine).
const FDIR = 'C:/Windows/Fonts/';
const ARIAL = fs.existsSync(FDIR + 'arial.ttf');
if (ARIAL) {
  doc.registerFont('Body', FDIR + 'arial.ttf');
  doc.registerFont('Body-Bold', FDIR + 'arialbd.ttf');
  doc.registerFont('Body-Italic', FDIR + 'ariali.ttf');
} else {
  console.warn('Arial introuvable → repli sur les polices standard (glyphes spéciaux dégradés).');
  doc.registerFont('Body', 'Helvetica');
  doc.registerFont('Body-Bold', 'Helvetica-Bold');
  doc.registerFont('Body-Italic', 'Helvetica-Oblique');
}
doc.registerFont('Mono', 'Courier');          // chasse fixe pour le code (WinAnsi → on sanitise les schémas)
const W = doc.page.width - 2 * M;

// --- sanitisation : SEULEMENT en repli (sans Arial). En mode Arial, on ne touche à rien. ---
function san(s) {
  s = String(s == null ? '' : s);
  if (ARIAL) return s;
  return s
    .replace(/→/g, '-->').replace(/←/g, '<--')
    .replace(/≥/g, '>=').replace(/≤/g, '<=')
    .replace(/[•▪]/g, '-')
    .replace(/✅/g, '[OK]').replace(/❌/g, '[X]')
    .replace(/⚠️?/g, '!')
    .replace(/[①②③④⑤⑥]/g, m => ({ '①': '1.', '②': '2.', '③': '3.', '④': '4.', '⑤': '5.', '⑥': '6.' }[m]))
    .replace(/ᵉ/g, 'e').replace(/²/g, '2')
    .replace(/[«»]/g, '"');
}
// --- sanitisation des schémas ASCII : Courier (WinAnsi) ne gère pas les box-drawing → équivalents ASCII ---
function sanCode(s) {
  return String(s == null ? '' : s)
    .replace(/[─━]/g, '-')
    .replace(/[│┃]/g, '|')
    .replace(/[┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬]/g, '+')
    .replace(/▼/g, 'v').replace(/▲/g, '^')
    .replace(/[►▶]/g, '>').replace(/[◄◀]/g, '<')
    .replace(/→/g, '>').replace(/←/g, '<')
    .replace(/✅/g, '[x]').replace(/❌/g, '[ ]')
    .replace(/[•▪]/g, '-')
    .replace(/≥/g, '>=').replace(/≤/g, '<=');
}

// ====================== helpers de mise en page ======================
function need(h) { if (doc.y + h > doc.page.height - M) doc.addPage(); }
function gap(h) { doc.y += h; }
function rule() { need(14); doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.rule).lineWidth(1).stroke(); gap(10); }

function h1(t) {
  gap(4); need(40);
  doc.font('Body-Bold').fontSize(19).fillColor(C.brand).text(san(t), M, doc.y, { width: W });
  gap(5);
}
function h2(t) {
  gap(8); need(30);
  doc.font('Body-Bold').fontSize(13.5).fillColor(C.brand).text(san(t), M, doc.y, { width: W });
  gap(3);
  doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.boxWarnLine).lineWidth(1.2).stroke();
  gap(7);
}
function h3(t) {
  gap(4); need(20);
  doc.font('Body-Bold').fontSize(11).fillColor(C.ink).text(san(t), M, doc.y, { width: W });
  gap(3);
}

// ---- formatage inline : **gras**, *italique*, `code`, _italique_ ----
function parseInline(text) {
  const runs = [];
  const re = /(\*\*[^*]+?\*\*|\*[^*\n]+?\*|`[^`]+?`|_[^_\n]+?_)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**')) runs.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith('`')) runs.push({ text: tok.slice(1, -1), code: true });
    else runs.push({ text: tok.slice(1, -1), italic: true });
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  const out = runs.filter(r => r.text.length);
  return out.length ? out : [{ text: ' ' }];
}
function measureRuns(runs, width, size) {
  doc.font('Body').fontSize(size);
  return doc.heightOfString(runs.map(r => r.text).join(''), { width });
}
function drawRuns(runs, x, y, width, size, baseColor) {
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    const f = r.code ? 'Mono' : r.bold ? 'Body-Bold' : r.italic ? 'Body-Italic' : 'Body';
    const col = r.mute ? C.mute : (baseColor || C.ink);
    doc.font(f).fontSize(r.code ? size - 0.5 : size).fillColor(col);
    doc.text(san(r.text), i === 0 ? x : undefined, i === 0 ? y : undefined,
      { width, continued: i < runs.length - 1 });
  }
}
function pRich(text, opts = {}) {
  const size = opts.size || 9.6;
  const runs = parseInline(text);
  const h = measureRuns(runs, W, size);
  need(h + 2);
  drawRuns(runs, M, doc.y, W, size, opts.color);
  gap(opts.gap == null ? 5 : opts.gap);
}
function bulletItem(text) {
  const indent = 14, size = 9.6;
  const runs = parseInline(text);
  const h = measureRuns(runs, W - indent, size);
  need(h + 2);
  const y = doc.y;
  doc.font('Body-Bold').fontSize(size).fillColor(C.brand).text(san('•'), M, y, { width: indent });
  drawRuns(runs, M + indent, y, W - indent, size, C.ink);
  gap(3);
}

// ---- callout riche (citations > ...) : fond coloré + barre + formatage inline ----
function richCallout(blocks, kind = 'warn') {
  const bg = kind === 'danger' ? C.boxDanger : kind === 'ok' ? C.boxOk : C.boxWarn;
  const line = kind === 'danger' ? C.boxDangerLine : kind === 'ok' ? C.boxOkLine : C.boxWarnLine;
  const padX = 12, padY = 9, innerW = W - 2 * padX, size = 9.4;
  let totalH = padY * 2;
  const measured = blocks.map(b => {
    const ind = b.type === 'bullet' ? 14 : 0;
    const runs = parseInline(b.text);
    const h = measureRuns(runs, innerW - ind, size);
    totalH += h + 4;
    return { runs, h, ind };
  });
  need(totalH + 6);
  const y0 = doc.y;
  doc.save();
  doc.rect(M, y0, W, totalH).fill(bg);
  doc.rect(M, y0, 4, totalH).fill(line);
  doc.restore();
  let yy = y0 + padY;
  for (let k = 0; k < measured.length; k++) {
    const mb = measured[k];
    if (blocks[k].type === 'bullet') {
      doc.font('Body-Bold').fontSize(size).fillColor(line).text(san('•'), M + padX, yy, { width: 14 });
    }
    drawRuns(mb.runs, M + padX + mb.ind, yy, innerW - mb.ind, size, C.ink);
    yy += mb.h + 4;
  }
  doc.y = y0 + totalH;
  gap(8);
}

// ---- bloc de code / schéma ASCII : encadré gris, Courier auto-dimensionné, espaces préservés ----
function codeBlock(lines) {
  const raw = lines.map(sanCode);
  const padX = 8, padY = 8, maxW = W - 2 * padX;
  let size = 9;
  doc.font('Mono');
  while (size > 5) {
    doc.fontSize(size);
    const longest = Math.max(...raw.map(l => doc.widthOfString(l.length ? l : ' ')));
    if (longest <= maxW) break;
    size -= 0.5;
  }
  doc.font('Mono').fontSize(size);
  const lh = doc.currentLineHeight() + 1;
  const boxH = raw.length * lh + 2 * padY;
  need(boxH + 6);
  const y0 = doc.y;
  doc.save();
  doc.lineWidth(0.8);
  doc.rect(M, y0, W, boxH).fillAndStroke(C.code, C.codeLine);
  doc.restore();
  let yy = y0 + padY;
  doc.font('Mono').fontSize(size).fillColor(C.codeInk);
  for (const l of raw) {
    doc.text(l.length ? l : ' ', M + padX, yy, { lineBreak: false, width: maxW, height: lh });
    yy += lh;
  }
  doc.y = y0 + boxH;
  gap(8);
}

// ---- tableau markdown → entrées lisibles « col1 — col2 — col3 » ----
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}
function isSep(line) { return /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes('-'); }
function rowRuns(cells, allBold) {
  const runs = [];
  cells.forEach((cell, ci) => {
    if (ci > 0) runs.push({ text: '   —   ', mute: true });
    const base = allBold || ci === 0;
    for (const r of parseInline(cell)) runs.push({ text: r.text, bold: base || r.bold, italic: r.italic, code: r.code });
  });
  return runs;
}
function tableBlock(rows) {
  if (!rows.length) return;
  const header = splitRow(rows[0]);
  let body = rows.slice(1);
  if (body.length && isSep(body[0])) body = body.slice(1);
  // en-tête
  const hRuns = rowRuns(header, true);
  let h = measureRuns(hRuns, W, 9.4);
  need(h + 8);
  drawRuns(hRuns, M, doc.y, W, 9.4, C.brand);
  gap(3);
  doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.rule).lineWidth(0.8).stroke();
  gap(5);
  // lignes
  for (const r of body) {
    const cells = splitRow(r);
    const runs = rowRuns(cells, false);
    const indent = 14, size = 9.2;
    const hh = measureRuns(runs, W - indent, size);
    need(hh + 3);
    const y = doc.y;
    doc.font('Body-Bold').fontSize(size).fillColor(C.boxWarnLine).text(san('▪'), M, y, { width: indent });
    drawRuns(runs, M + indent, y, W - indent, size, C.ink);
    gap(5);
  }
  gap(3);
}

// ---- découpage d'une citation > ... en blocs (paragraphes + items numérotés) ----
function parseQuoteBlocks(qlines) {
  const blocks = [];
  let cur = null;
  for (const ln of qlines) {
    if (ln.trim() === '') { if (cur) { blocks.push(cur); cur = null; } continue; }
    const mNum = ln.match(/^\s*\d+\.\s+(.*)/);
    if (mNum) { if (cur) blocks.push(cur); cur = { type: 'bullet', text: mNum[1].trim() }; }
    else if (/^\s/.test(ln) && cur) { cur.text += ' ' + ln.trim(); }
    else if (cur && cur.type === 'p') { cur.text += ' ' + ln.trim(); }
    else { if (cur) blocks.push(cur); cur = { type: 'p', text: ln.trim() }; }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

// ====================== page de garde ======================
function cover(subtitle) {
  doc.font('Body').fontSize(9).fillColor(C.mute)
    .text('Billy — document de référence', M, M + 6, { width: W, align: 'right' });
  doc.y = M + 150;
  doc.font('Body-Bold').fontSize(34).fillColor(C.brand).text('Billy', M, doc.y, { width: W });
  gap(8);
  doc.font('Body-Bold').fontSize(17).fillColor(C.ink).text(san(subtitle), { width: W });
  gap(12);
  doc.font('Body').fontSize(11).fillColor(C.mute).text('Billy — document de référence', { width: W });
  gap(26);
  richCallout([{ type: 'p', text: '**Avertissement.** Brouillon de travail, non validé par des professionnels.' }], 'danger');
  doc.addPage();
}

// ====================== conversion Markdown → PDF ======================
const md = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n').split('\n');

// titre du doc = premier H1 (sert à la page de garde, pas re-rendu dans le corps)
let docTitle = 'Sous le capot';
for (const l of md) { const m = l.match(/^#\s+(.*)/); if (m) { docTitle = m[1].trim(); break; } }
let subtitle = docTitle.replace(/^Billy\s*[—-]\s*/i, '');
cover(subtitle);

let i = 0, firstH1Skipped = false;
const isSpecial = (l) => /^```/.test(l) || l.trim().startsWith('|') || l.trim().startsWith('>')
  || /^#{1,6}\s/.test(l) || /^---+$/.test(l.trim()) || /^(\s*)([-*]|\d+\.)\s+/.test(l);

while (i < md.length) {
  const line = md[i];

  if (line.trim() === '') { i++; continue; }

  // bloc de code
  if (/^```/.test(line.trim())) {
    i++;
    const buf = [];
    while (i < md.length && !/^```/.test(md[i].trim())) { buf.push(md[i]); i++; }
    i++; // saute la clôture
    codeBlock(buf);
    continue;
  }

  // tableau
  if (line.trim().startsWith('|')) {
    const rows = [];
    while (i < md.length && md[i].trim().startsWith('|')) { rows.push(md[i]); i++; }
    tableBlock(rows);
    continue;
  }

  // citation → callout
  if (line.trim().startsWith('>')) {
    const q = [];
    while (i < md.length && md[i].trim().startsWith('>')) {
      q.push(md[i].replace(/^>\s?/, ''));
      i++;
    }
    richCallout(parseQuoteBlocks(q), 'warn');
    continue;
  }

  // titres
  const hm = line.match(/^(#{1,6})\s+(.*)/);
  if (hm) {
    const lvl = hm[1].length, txt = hm[2].trim();
    if (lvl === 1) {
      if (!firstH1Skipped) { firstH1Skipped = true; i++; continue; }
      h1(txt);
    } else if (lvl === 2) h2(txt);
    else h3(txt);
    i++;
    continue;
  }

  // règle horizontale
  if (/^---+$/.test(line.trim())) { gap(2); rule(); i++; continue; }

  // listes
  if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
    const items = [];
    while (i < md.length) {
      const l = md[i];
      const m = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
      if (m) { items.push(m[3]); i++; continue; }
      if (/^\s+\S/.test(l) && items.length) { items[items.length - 1] += ' ' + l.trim(); i++; continue; }
      break;
    }
    for (const it of items) bulletItem(it);
    gap(2);
    continue;
  }

  // paragraphe (regroupe les lignes consécutives non-spéciales)
  const para = [line.trim()];
  i++;
  while (i < md.length && md[i].trim() !== '' && !isSpecial(md[i])) { para.push(md[i].trim()); i++; }
  pRich(para.join(' '));
}

// ====================== pieds de page (numérotation, sauf page de garde) ======================
const range = doc.bufferedPageRange();
for (let k = 0; k < range.count; k++) {
  if (k === 0) continue;                       // pas de pied sur la couverture
  doc.switchToPage(range.start + k);
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;                 // empêche pdfkit d'ajouter une page en écrivant dans la marge
  const fy = doc.page.height - 34;
  doc.font('Body').fontSize(8).fillColor(C.mute);
  doc.text('Billy — Sous le capot (brouillon de travail, non validé)', M, fy, { lineBreak: false });
  doc.text((k + 1) + ' / ' + range.count, M + W - 60, fy, { width: 60, align: 'right', lineBreak: false });
  doc.page.margins.bottom = oldBottom;
}

doc.end();
doc.on('end', () => { });
console.log('PDF généré : ' + OUT + ' (' + range.count + ' pages)');
