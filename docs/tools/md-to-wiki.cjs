/* Convertit un Markdown en HTML "wiki-safe" pour Wikifluence.
 *
 * ⚠️ Le FRONT du wiki (public/app.js, cleanNode) n'autorise qu'un jeu de balises :
 *    h1-h3, p, br, strong/b, em/i, u, s, ul/ol/li, blockquote, pre, code, a, img, hr, div, span.
 *    => TABLE/TR/TD sont SUPPRIMÉS (cellules fusionnées = illisible) et TOUS les attributs
 *       style/id inline sont retirés (seul class∈{todo,done,callout,mention,date} survit).
 * Conséquences appliquées ici :
 *    - tableaux Markdown  -> listes <ul> (2 col : « <strong>col1</strong> — col2 » ;
 *      N col : « <strong>col1</strong> — entête2 : col2 · entête3 : col3 »).
 *    - aucun style inline (inutile : strippé) ; citations -> <div class="callout">.
 *    - blocs ``` -> <pre> (conservés ; les schémas ASCII passent).
 *    - un SOMMAIRE (liste des sections h2/h3) est ajouté en tête (non cliquable : les ancres
 *      id sont strippées par le front -> voir backlog "TOC auto").
 * Usage : node docs/tools/md-to-wiki.cjs <fichier.md>  -> écrit <fichier>.wiki.html
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
if (!SRC) { console.error('usage: md-to-wiki.cjs <file.md>'); process.exit(1); }
const md = fs.readFileSync(SRC, 'utf8');

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>'); // gras (peut contenir de l'italique)
  s = s.replace(/(^|[\s(>])\*([^*\s][^*]*?)\*(?=[\s).,;:!?<]|$)/g, '$1<em>$2</em>'); // *italique*
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

const lines = md.split(/\r?\n/);
const blocks = []; // {type, ...} pour pouvoir construire le sommaire avant d'émettre
let i = 0, para = [], list = null;

function flushPara() { if (para.length) { blocks.push({ type: 'p', html: inline(para.join(' ')) }); para = []; } }
function flushList() { if (list) { blocks.push(list); list = null; } }

function tableToList(rows) {
  const cells = rows.map((r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()));
  const head = cells[0];
  const body = cells.slice(2); // saute le séparateur ---
  // items = HTML FINAL (inline appliqué ici une seule fois) → émis sans ré-inline (type 'ulraw').
  const items = body.map((row) => {
    const l0 = inline(row[0] || '');
    const left = /<(strong|b)\b/i.test(l0) ? l0 : `<strong>${l0}</strong>`;
    if (head.length <= 2) {
      const right = inline(row[1] || '');
      return right ? `${left} — ${right}` : left;
    }
    const rest = row.slice(1).map((c, k) => c ? `${inline(head[k + 1])} : ${inline(c)}` : '').filter(Boolean).join(' · ');
    return rest ? `${left} — ${rest}` : left;
  });
  return { type: 'ulraw', items };
}

while (i < lines.length) {
  let ln = lines[i];
  if (/^```/.test(ln.trim())) {
    flushPara(); flushList();
    i++; const buf = [];
    while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
    i++;
    blocks.push({ type: 'pre', text: buf.join('\n') });
    continue;
  }
  if (/^\s*\|.*\|\s*$/.test(ln)) {
    flushPara(); flushList();
    const rows = [];
    while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
    blocks.push(tableToList(rows));
    continue;
  }
  let m;
  if ((m = ln.match(/^#\s+(.*)/))) { flushPara(); flushList(); blocks.push({ type: 'h1', text: m[1] }); i++; continue; }
  if ((m = ln.match(/^##\s+(.*)/))) { flushPara(); flushList(); blocks.push({ type: 'h2', text: m[1] }); i++; continue; }
  if ((m = ln.match(/^###\s+(.*)/))) { flushPara(); flushList(); blocks.push({ type: 'h3', text: m[1] }); i++; continue; }
  if (/^---+\s*$/.test(ln)) { flushPara(); flushList(); blocks.push({ type: 'hr' }); i++; continue; }
  if (/^>\s?/.test(ln)) {
    flushPara(); flushList();
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
    blocks.push({ type: 'callout', html: inline(buf.join(' ')) });
    continue;
  }
  if ((m = ln.match(/^\s*[-*]\s+(.*)/))) { flushPara(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(m[1]); i++; continue; }
  if ((m = ln.match(/^\s*\d+\.\s+(.*)/))) { flushPara(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(m[1]); i++; continue; }
  if (/^\s*$/.test(ln)) { flushPara(); flushList(); i++; continue; }
  if (list && list.items.length) { list.items[list.items.length - 1] += ' ' + ln.trim(); i++; continue; }
  para.push(ln.trim());
  i++;
}
flushPara(); flushList();

// --- Sommaire (sections h2/h3 ; le titre h1 sert d'intro, pas listé) ---
const toc = blocks.filter((b) => b.type === 'h2' || b.type === 'h3');
let _toc = null;
function sommaireHtml() {
  if (toc.length < 3) return '';
  if (_toc) return _toc;
  let out = '<h2>Sommaire</h2><ul>';
  let k = 0;
  while (k < toc.length) {
    const b = toc[k];
    if (b.type === 'h2') {
      out += `<li><strong>${inline(b.text)}</strong>`;
      let j = k + 1; const subs = [];
      while (j < toc.length && toc[j].type === 'h3') { subs.push(toc[j]); j++; }
      if (subs.length) out += '<ul>' + subs.map((s) => `<li>${inline(s.text)}</li>`).join('') + '</ul>';
      out += '</li>';
      k = j;
    } else { out += `<li>${inline(b.text)}</li>`; k++; }
  }
  out += '</ul>';
  _toc = out;
  return out;
}

// --- Émission HTML finale ---
let html = '';
for (const b of blocks) {
  switch (b.type) {
    case 'h1': html += `<h1>${inline(b.text)}</h1>`; if (sommaireHtml()) html += sommaireHtml() + '<hr>'; break;
    case 'h2': html += `<h2>${inline(b.text)}</h2>`; break;
    case 'h3': html += `<h3>${inline(b.text)}</h3>`; break;
    case 'p': html += `<p>${b.html}</p>`; break;
    case 'callout': html += `<div class="callout">${b.html}</div>`; break;
    case 'pre': html += `<pre>${esc(b.text)}</pre>`; break;
    case 'hr': html += '<hr>'; break;
    case 'ul': case 'ol': html += `<${b.type}>` + b.items.map((it) => `<li>${inline(it)}</li>`).join('') + `</${b.type}>`; break;
    case 'ulraw': html += '<ul>' + b.items.map((it) => `<li>${it}</li>`).join('') + '</ul>'; break; // déjà inline-é
  }
}
// si pas de h1 en tête, préfixer le sommaire
if (blocks[0] && blocks[0].type !== 'h1' && sommaireHtml()) html = sommaireHtml() + '<hr>' + html;

const out = SRC.replace(/\.md$/, '') + '.wiki.html';
fs.writeFileSync(out, html, 'utf8');
console.log('OK ->', path.basename(out), '|', html.length, 'chars |', toc.length, 'sections au sommaire');
