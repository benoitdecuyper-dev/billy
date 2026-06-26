/* Cohérence : toutes les phrases NEUTRES du script (que Billy peut dire en démo) doivent
 * passer le filtre anti-suggestion. Évite qu'une formulation et le filtre divergent. npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { audit } from './antiSuggestion.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.resolve(__dirname, '../../public/content/script-billy.json');
const NEUTRAL = ['P1', 'P2', 'P3', 'P4', 'P7'];

test('toutes les phrases neutres du script passent le filtre', () => {
  const s = JSON.parse(readFileSync(scriptPath, 'utf8'));
  const blocked = [];
  const check = (it) => { const v = audit(it.formulation, {}); if (v.decision === 'BLOCK') blocked.push(`${it.id} [${v.ruleId}] : ${it.formulation}`); };
  for (const p of s.phases) {
    if (!NEUTRAL.includes(p.id)) continue;
    for (const it of p.items) check(it);
  }
  // Pool conversationnel partagé (neutre, proposé en plus du menu de phase)
  for (const it of (s.conversationnel && s.conversationnel.items) || []) check(it);
  assert.equal(blocked.length, 0, 'Phrases bloquées par le filtre :\n' + blocked.join('\n'));
});
