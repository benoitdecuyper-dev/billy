/* Publication & réparation des pages Billy sur Wikifluence.
 * Le front du wiki strippe TABLE/TR/TD et les styles inline (public/app.js cleanNode) →
 * les pages stockées en <table> sont illisibles. Ce script :
 *   - convertit les <table> en listes <ul> lisibles,
 *   - ajoute un <h2>Sommaire</h2> en tête (sections h2/h3),
 *   - publie la nouvelle page "Sous le capot" depuis son HTML wiki-safe.
 *
 * Usage :
 *   node docs/tools/wiki-billy.cjs list
 *   node docs/tools/wiki-billy.cjs fix <id>        # répare une page (dry-run sauf --apply)
 *   node docs/tools/wiki-billy.cjs fix <id> --apply
 *   node docs/tools/wiki-billy.cjs fix-all --apply # répare toutes les pages Billy (hors home)
 *   node docs/tools/wiki-billy.cjs publish --apply # publie "Sous le capot"
 */
const fs = require('fs');
const https = require('https');

const SUPA = 'https://xxmjhrsuovebxpsrfusf.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bWpocnN1b3ZlYnhwc3JmdXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzU0NDgsImV4cCI6MjA5NzIxMTQ0OH0.i9napNmhEfgoLc1IxcHEpVdfL9h3eXl3xar-fbM4XDs';
const WIKI = 'wikifluence.onrender.com';
const EMAIL = 'claude-code@sporae.fr';
const PASS = 'Wiki-Agent-2026-xZ9q';

function req(host, pathname, method, headers, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const h = Object.assign({ 'Content-Type': 'application/json' }, headers);
    if (data) h['Content-Length'] = Buffer.byteLength(data);
    const r = https.request({ host, path: pathname, method, headers: h }, (resp) => {
      let s = ''; resp.on('data', (d) => (s += d));
      resp.on('end', () => { let j; try { j = JSON.parse(s); } catch { j = s; } resolve({ status: resp.statusCode, body: j }); });
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}
async function auth() {
  const r = await req('xxmjhrsuovebxpsrfusf.supabase.co', '/auth/v1/token?grant_type=password', 'POST', { apikey: ANON }, { email: EMAIL, password: PASS });
  if (!r.body || !r.body.access_token) throw new Error('auth KO: ' + JSON.stringify(r.body).slice(0, 200));
  return r.body.access_token;
}

/* --- transformation des tableaux HTML stockés -> listes --- */
function stripTags(s) { return String(s).replace(/<[^>]+>/g, '').trim(); }
function tablesToLists(html) {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (tbl) => {
    const rows = [...tbl.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);
    if (!rows.length) return '';
    const parse = (row) => [...row.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => m[1].trim());
    const cells = rows.map(parse);
    const head = cells[0];
    const body = cells.slice(1);
    const items = body.map((row) => {
      const c0 = row[0] || '';
      const left = /<(strong|b)\b/i.test(c0) ? c0 : `<strong>${c0}</strong>`;
      if (head.length <= 2) { const r = row[1] || ''; return r ? `<li>${left} — ${r}</li>` : `<li>${left}</li>`; }
      const rest = row.slice(1).map((c, k) => c ? `${stripTags(head[k + 1] || '')} : ${c}` : '').filter(Boolean).join(' · ');
      return rest ? `<li>${left} — ${rest}</li>` : `<li>${left}</li>`;
    });
    return '<ul>' + items.join('') + '</ul>';
  });
}

/* --- sommaire depuis les <h2>/<h3> du HTML --- */
function buildSommaire(html) {
  const heads = [...html.matchAll(/<(h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => ({ lvl: m[1].toLowerCase(), text: m[2] }))
    .filter((h) => stripTags(h.text).toLowerCase() !== 'sommaire');
  if (heads.length < 3) return '';
  let out = '<h2>Sommaire</h2><ul>'; let k = 0;
  while (k < heads.length) {
    const b = heads[k];
    if (b.lvl === 'h2') {
      out += `<li><strong>${b.text}</strong>`;
      let j = k + 1; const subs = [];
      while (j < heads.length && heads[j].lvl === 'h3') { subs.push(heads[j]); j++; }
      if (subs.length) out += '<ul>' + subs.map((s) => `<li>${s.text}</li>`).join('') + '</ul>';
      out += '</li>'; k = j;
    } else { out += `<li>${b.text}</li>`; k++; }
  }
  return out + '</ul>';
}
function addSommaire(html) {
  // retire un sommaire précédent éventuel (idempotent)
  html = html.replace(/<h2>\s*Sommaire\s*<\/h2><ul>[\s\S]*?<\/ul>\s*(<hr\s*\/?>)?/i, '');
  const toc = buildSommaire(html);
  if (!toc) return html;
  // insère après le 1er <h1>…</h1> s'il existe, sinon en tête
  const m = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (m) { const idx = m.index + m[0].length; return html.slice(0, idx) + toc + '<hr>' + html.slice(idx); }
  return toc + '<hr>' + html;
}
function fixContent(html) { return addSommaire(tablesToLists(html)); }

/* --- commandes --- */
async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const apply = process.argv.includes('--apply');
  const jwt = await auth();
  const A = { Authorization: 'Bearer ' + jwt };
  const all = (await req(WIKI, '/api/pages', 'GET', A)).body;
  const pages = (all.pages || all || []);
  const billy = pages.filter((p) => p.rubrique === 'Billy');

  if (cmd === 'list') {
    billy.forEach((p) => console.log((p.spaceHome ? '[HOME] ' : '       ') + 'id=' + p.id + ' | ' + p.title + ' | <table>:' + /<table/i.test(p.content || '')));
    return;
  }
  if (cmd === 'fix' || cmd === 'fix-all') {
    const targets = cmd === 'fix' ? billy.filter((p) => String(p.id) === String(arg)) : billy.filter((p) => !p.spaceHome);
    for (const p of targets) {
      const full = (await req(WIKI, '/api/pages/' + p.id, 'GET', A)).body;
      const content = (full.page || full).content || '';
      const fixed = fixContent(content);
      const changed = fixed !== content;
      console.log(`#${p.id} "${p.title}" : ${changed ? 'MODIF' : 'inchangé'} (${content.length}→${fixed.length} ch, tables:${(content.match(/<table/gi) || []).length}→0)`);
      if (changed && apply) {
        const r = await req(WIKI, '/api/pages/' + p.id, 'PUT', A, { content: fixed });
        console.log('   PUT ->', r.status);
      }
    }
    return;
  }
  if (cmd === 'publish') {
    const html = fs.readFileSync('docs/00-SOUS-LE-CAPOT.wiki.html', 'utf8');
    const title = 'Sous le capot — méthodes, sources & moteur de dialogue';
    const existing = billy.find((p) => p.title === title);
    if (existing) {
      console.log('déjà publiée #' + existing.id + ' → mise à jour' + (apply ? '' : ' (dry-run)'));
      if (apply) { const r = await req(WIKI, '/api/pages/' + existing.id, 'PUT', A, { content: html }); console.log('PUT ->', r.status); }
    } else {
      console.log('création (rubrique Billy)' + (apply ? '' : ' (dry-run)') + ' — ' + html.length + ' ch');
      if (apply) { const r = await req(WIKI, '/api/pages', 'POST', A, { title, content: html, rubrique: 'Billy' }); console.log('POST ->', r.status, 'id=' + ((r.body.page || r.body || {}).id)); }
    }
    return;
  }
  console.log('cmd inconnue. list | fix <id> | fix-all | publish  (+ --apply)');
}
main().catch((e) => { console.error('ERREUR', e.message); process.exit(1); });
