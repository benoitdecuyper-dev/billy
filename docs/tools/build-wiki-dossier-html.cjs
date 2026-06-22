/* Génère le HTML de la page wiki "Dossier de validation clinique" (espace Billy).
   Le répertoire (Annexe A) est tiré de script-billy.json → reste synchro.
   Usage : node docs/tools/build-wiki-dossier-html.cjs > docs/_wiki-dossier.html */
const SCRIPT = require('../../public/content/script-billy.json');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const N = SCRIPT.phases.reduce((s, p) => s + ((p.items || []).length), 0);
const stColor = (st) => st === 'validé' ? '#2f7d32' : st === 'proposé' ? '#2b6cb0' : '#9a6700';

let h = '';
h += `<p style="background:#fdeaea;border-left:4px solid #d64545;padding:8px 12px;border-radius:4px"><strong>Document de travail — confidentiel.</strong> Tout le contenu de Billy est un <strong>BROUILLON</strong> construit à partir de sources reconnues, mais <strong>rien n'est utilisé avec un enfant avant validation</strong> par des professionnels. Cette page est destinée aux <strong>professionnels de santé</strong> (pédopsychiatrie de la petite enfance, pédiatrie, psychologie de l'enfant). Une version PDF imprimable (avec grille de validation à signer) est disponible auprès de l'équipe.</p>`;

h += `<h2>Résumé (format IMRAD)</h2>`;
h += `<p><strong>Introduction.</strong> Les violences faites aux jeunes enfants sont sous-repérées, et un adulte non formé qui questionne mal peut contaminer la parole de l'enfant (la rendant inexploitable) ou lui nuire. Billy vise à aider à <strong>repérer</strong> un enfant de 2-5 ans potentiellement victime, sans jamais l'interroger, et à <strong>orienter</strong> vers les professionnels. Il ne diagnostique pas et ne recueille pas le récit sensible.</p>`;
h += `<p><strong>Méthodes.</strong> Posture « Option A » (mise en confiance, ouverture neutre, repérage, orientation). Répertoire <strong>fermé</strong> de phrases pré-validées, distillé depuis des sources reconnues (NICHD 2021, Barnahus, Dr Salmona, CRIAVS, CIIVISE, protegernosenfants, Guide VSM, NSPCC/RAINN/UNICEF) — chaque phrase tracée à sa source ; filtre anti-suggestion (fail-closed) avant toute parole.</p>`;
h += `<p><strong>Résultats.</strong> À ce jour : <strong>${N} phrases</strong> réparties en ${SCRIPT.phases.length} phases (Annexe A ci-dessous), des règles d'interdits et un circuit d'orientation (119, CRIP, procureur, UAPED), et un prototype fonctionnel en ligne. Statut : <strong>BROUILLON</strong> — aucune phrase n'a encore le statut « validé ».</p>`;
h += `<p><strong>Discussion.</strong> Quatre décisions cliniques à trancher : (1) suggestibilité maximale à 2-5 ans → aucune question fermée ; (2) dissociation → le rapport alerte au lieu de rassurer ; (3) faux positifs → un signal exige comportement + critère, par âge ; (4) la parole d'un tout-petit n'est jamais une preuve → verbatim brut, sans interprétation. Limites : non validé, et l'outil ne remplace pas un professionnel.</p>`;

h += `<h2>1. Ce qu'est Billy — et ce qu'il n'est pas</h2>`;
h += `<p>Application smartphone à IA vocale, incarnée par une mascotte (un écureuil), <strong>tenue et opérée par l'adulte</strong> (l'enfant ne lit pas), en mains-libres. Posture « Option A » : <em>mise en confiance → ouverture neutre → repérage → orientation</em>. Billy <strong>n'investigue pas, ne qualifie pas, ne conclut pas, ne nomme aucun auteur</strong> ; le recueil du récit sensible reste 100 % au professionnel.</p>`;
h += `<p><strong>Billy n'est PAS</strong> : un outil de diagnostic · une preuve judiciaire · un enquêteur · un substitut au professionnel · un chatbot qui improvise. Chaque énoncé possible est écrit, tracé et verrouillé à l'avance.</p>`;

h += `<h2>2. Les fondements scientifiques (et leur apport concret)</h2>`;
h += `<ul>`;
h += `<li><strong>NICHD 2021</strong> — structure en phases, hiérarchie des questions (invitations &gt; relance sur un mot de l'enfant &gt; questions ouvertes ; fermées/suggestives proscrites), règles de base, règle absolue « ne jamais nommer un acte/lieu/auteur avant l'enfant ». → <em>phases de séance + filtre anti-suggestion.</em></li>`;
h += `<li><strong>Barnahus / PROMISE</strong> — un seul intervenant, observateurs passifs, entretien unique. → <em>2ᵉ écran d'observation passive ; ne pas faire répéter.</em></li>`;
h += `<li><strong>Dr Salmona (psychotraumatisme)</strong> — un enfant gravement traumatisé peut sembler « calme » (dissociation) : s'inquiéter davantage ; ne jamais nommer l'auteur par un terme affectif. → <em>le rapport signale le calme au lieu de rassurer ; règle des termes affectifs codée ; préface parent.</em></li>`;
h += `<li><strong>CRIAVS</strong> — développement normal vs préoccupant ; un signal est un indice, pas un diagnostic ; critères de bascule. → <em>détection « comportement + critère », par âge, pour limiter les faux positifs.</em></li>`;
h += `<li><strong>CIIVISE</strong> — « signaler n'est pas enquêter » ; croire / rassurer / orienter ; phrases à dire / ne pas dire. → <em>répertoire des bonnes réactions, interdits, orientation 119.</em></li>`;
h += `<li><strong>protegernosenfants.fr · Guide VSM (Ville de Paris) · MIPROF · 119 · La Voix de l'Enfant</strong> — réflexes (noter les mots exacts, ne pas confronter, ne pas promettre le secret), signaux par âge, circuit d'orientation. → <em>détection, rapport verbatim, écran parent, orientation.</em></li>`;
h += `<li><strong>NSPCC · RAINN · UNICEF</strong> — plusieurs petites conversations &gt; un grand entretien ; ne pas interpréter le calme ; se mettre à hauteur. → <em>multi-séances, réassurance, signaux faibles.</em></li>`;
h += `</ul>`;
h += `<p style="color:#666"><em>Détail complet : voir la page « Les sources et comment elles ont nourri Billy ».</em></p>`;

h += `<h2>3. Garde-fous non négociables</h2>`;
h += `<ul><li>Aucun diagnostic, aucune preuve, aucun interrogatoire.</li><li>Aucune question fermée/suggestive ; ne jamais nommer un acte/lieu/auteur avant l'enfant.</li><li>Aucune pression, aucune récompense, jamais faire répéter ; silences respectés.</li><li>Ne jamais promettre le secret.</li><li>Seuil d'orientation très bas ; 119 systématiquement proposé.</li><li>Données ultra-sensibles : minimisation, chiffrement ; enregistrement réel désactivé (DPIA en attente).</li></ul>`;

h += `<h2>4. Ce que nous vous demandons de valider</h2>`;
h += `<ul><li>La posture et les <strong>formulations</strong> (le répertoire fermé, phase par phase — Annexe A).</li><li>La <strong>sécurité de l'approche 2-5 ans</strong> (le point le plus sensible).</li><li>La couche <strong>anti-suggestion</strong> et le <strong>seuil de détection</strong> (ni manqué, ni sur-alerte).</li><li>L'<strong>escalade</strong> et le <strong>rapport</strong> (verbatim brut, sans interprétation).</li><li>Le conflit d'intérêts : l'adulte qui tient le téléphone peut être la personne en cause.</li></ul>`;

// ---- Annexe A : répertoire complet ----
h += `<h2>Annexe A — Répertoire complet des phrases</h2>`;
h += `<p>Intégralité des phrases que Billy peut prononcer (source : <code>script-billy.json</code>, ${esc(SCRIPT.meta && SCRIPT.meta.version)}). Chaque phrase est tracée jusqu'à sa source. Statuts : <span style="color:#9a6700">brouillon</span> / <span style="color:#2b6cb0">proposé</span> / <span style="color:#2f7d32">validé</span> / à revoir. <strong>Aucune n'est aujourd'hui « validé »</strong> — c'est ce répertoire que nous vous demandons de relire ligne à ligne.</p>`;
for (const ph of SCRIPT.phases) {
  h += `<h3>${esc(ph.id)} — ${esc(ph.titre)}</h3>`;
  h += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr style="background:#f6f8fa"><th style="text-align:left">Phrase</th><th style="text-align:left;white-space:nowrap">Statut</th><th style="text-align:left">Source</th></tr></thead><tbody>`;
  for (const it of (ph.items || [])) {
    h += `<tr><td>« ${esc(it.formulation)} »</td><td style="white-space:nowrap;color:${stColor(it.statut)}">${esc(it.statut)}</td><td style="color:#555">${esc(it.source)}</td></tr>`;
  }
  h += `</tbody></table>`;
}
h += `<h3>Ce que Billy ne dit JAMAIS (interdits)</h3><ul>`;
for (const r of ((SCRIPT.interdits && SCRIPT.interdits.regles) || [])) h += `<li>${esc(r.regle)} <span style="color:#888">— source : ${esc(r.source)}</span></li>`;
h += `</ul>`;
h += `<h3>Orientation (présentée à l'adulte)</h3><ul>`;
for (const n of ((SCRIPT.orientation && SCRIPT.orientation.niveaux) || [])) h += `<li><strong>${esc(n.niveau)}</strong> : ${esc(n.action)}</li>`;
h += `</ul>`;
if (SCRIPT.orientation && SCRIPT.orientation.note) h += `<p style="color:#666"><em>${esc(SCRIPT.orientation.note)}</em></p>`;

h += `<h2>Grille de validation</h2>`;
h += `<p>Pour une <strong>validation formelle</strong> (cases Validé / À corriger / Refusé + commentaire, par item, et signature), utiliser la <strong>version PDF imprimable</strong> du dossier (disponible auprès de l'équipe). Vos corrections priment sur toute considération de produit.</p>`;

h += `<p style="background:#fff6e9;border-left:4px solid #d8a657;padding:8px 12px;border-radius:4px"><strong>Rappel.</strong> Compilation de travail, <strong>non validée</strong>. Aucune source ne vaut caution professionnelle ; aucune phrase n'est dite à un enfant tant que des professionnels (pédopsychiatrie petite enfance, audition/NICHD, juriste/magistrat, associations) ne l'ont pas validée. Les passages « entre guillemets » sont des verbatim ; le reste est une synthèse susceptible d'erreur.</p>`;

process.stdout.write(h);
