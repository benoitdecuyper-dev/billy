/* Génère le dossier de validation clinique de Billy (PDF A4) pour les professionnels de santé.
   Usage : node docs/tools/build-dossier-pro.cjs
   Sortie : docs/Billy-dossier-validation-clinique.pdf
   Police standard Body (WinAnsi) → accents/guillemets français OK, aucun embed requis. */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const SCRIPT = require('../../public/content/script-billy.json');   // source de vérité des phrases
// police Unicode embarquée (Arial) → tous les glyphes passent ; san = normalisation défensive
const san = (s) => String(s == null ? '' : s);

const OUT = path.join(__dirname, '..', 'Billy-dossier-validation-clinique.pdf');
const C = {
  brand: '#b35a00', ink: '#1f2328', mute: '#5a6168', danger: '#b42318',
  boxWarn: '#fff6e9', boxWarnLine: '#d8a657', boxDanger: '#fdeaea', boxDangerLine: '#d64545',
  boxOk: '#eef6ee', boxOkLine: '#3f8f4f', rule: '#dfe2e6',
};
const M = 56;                       // marge
const doc = new PDFDocument({ size: 'A4', margins: { top: M, bottom: M, left: M, right: M }, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));
// Police Unicode embarquée (Arial) sous les noms Body* → vrais glyphes (→, ≥, ×…).
// Repli propre sur les polices standard si Arial est introuvable (autre machine).
const FDIR = 'C:/Windows/Fonts/';
if (fs.existsSync(FDIR + 'arial.ttf')) {
  doc.registerFont('Body', FDIR + 'arial.ttf');
  doc.registerFont('Body-Bold', FDIR + 'arialbd.ttf');
  doc.registerFont('Body-Italic', FDIR + 'ariali.ttf');
} else {
  console.warn('Arial introuvable → repli sur les polices standard (glyphes spéciaux dégradés).');
  doc.registerFont('Body', 'Helvetica');
  doc.registerFont('Body-Bold', 'Helvetica-Bold');
  doc.registerFont('Body-Italic', 'Helvetica-Oblique');
}
const W = doc.page.width - 2 * M;   // largeur utile

// ---- helpers ----
function need(h) { if (doc.y + h > doc.page.height - M) doc.addPage(); }
function gap(h) { doc.y += h; }
function rule() { need(14); doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.rule).lineWidth(1).stroke(); gap(10); }

function h1(t) {
  need(40);
  doc.font('Body-Bold').fontSize(20).fillColor(C.brand).text(t, M, doc.y, { width: W });
  gap(4);
}
function h2(t) {
  gap(6); need(28);
  doc.font('Body-Bold').fontSize(13.5).fillColor(C.brand).text(t, M, doc.y, { width: W });
  gap(3);
  doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.boxWarnLine).lineWidth(1.2).stroke();
  gap(7);
}
function h3(t) {
  gap(3); need(20);
  doc.font('Body-Bold').fontSize(11).fillColor(C.ink).text(t, M, doc.y, { width: W });
  gap(2);
}
function p(t, opts = {}) {
  const size = opts.size || 9.6;
  doc.font(opts.font || 'Body').fontSize(size).fillColor(opts.color || C.ink);
  const h = doc.heightOfString(t, { width: W, align: opts.align || 'left' });
  need(h + 2);
  doc.text(t, M, doc.y, { width: W, align: opts.align || 'left' });
  gap(opts.gap == null ? 5 : opts.gap);
}
function bullets(items, opts = {}) {
  const size = opts.size || 9.6;
  doc.font('Body').fontSize(size).fillColor(C.ink);
  for (const it of items) {
    const indent = 14;
    const tw = W - indent;
    const h = doc.heightOfString(it, { width: tw });
    need(h + 2);
    const y = doc.y;
    doc.font('Body-Bold').fillColor(C.brand).text('•', M, y, { width: indent });
    doc.font('Body').fillColor(C.ink).text(it, M + indent, y, { width: tw });
    gap(3);
  }
  gap(2);
}
function callout(title, body, kind = 'warn') {
  const bg = kind === 'danger' ? C.boxDanger : kind === 'ok' ? C.boxOk : C.boxWarn;
  const line = kind === 'danger' ? C.boxDangerLine : kind === 'ok' ? C.boxOkLine : C.boxWarnLine;
  const padX = 12, padY = 9;
  doc.font('Body-Bold').fontSize(10);
  let inner = '';
  if (title) inner += title;
  doc.font('Body').fontSize(9.4);
  // mesure hauteur (titre gras + corps)
  let hTitle = 0;
  if (title) { doc.font('Body-Bold').fontSize(10); hTitle = doc.heightOfString(title, { width: W - 2 * padX }) + 3; }
  doc.font('Body').fontSize(9.4);
  const hBody = doc.heightOfString(body, { width: W - 2 * padX });
  const boxH = padY * 2 + hTitle + hBody;
  need(boxH + 6);
  const y0 = doc.y;
  doc.save();
  doc.rect(M, y0, W, boxH).fill(bg);
  doc.rect(M, y0, 4, boxH).fill(line);
  doc.restore();
  let yy = y0 + padY;
  if (title) {
    doc.font('Body-Bold').fontSize(10).fillColor(C.ink).text(title, M + padX, yy, { width: W - 2 * padX });
    yy += hTitle;
  }
  doc.font('Body').fontSize(9.4).fillColor(C.ink).text(body, M + padX, yy, { width: W - 2 * padX });
  doc.y = y0 + boxH;
  gap(8);
}
// ligne source : nom (gras) + apport ; puis "→ Dans Billy" en italique muted
function source(name, what, where) {
  h3(name);
  p(what, { gap: 3 });
  p('→ Dans Billy : ' + where, { font: 'Body-Italic', color: C.mute, size: 9.2, gap: 7 });
}
// case à cocher de la grille
function checkboxRow(label) {
  const rowGap = 6;
  doc.font('Body').fontSize(9.4).fillColor(C.ink);
  const labelH = doc.heightOfString(label, { width: W });
  need(labelH + 26 + rowGap);
  doc.font('Body-Bold').fontSize(9.6).fillColor(C.ink).text(label, M, doc.y, { width: W });
  gap(4);
  const boxes = ['Validé', 'À corriger', 'Refusé'];
  const y = doc.y; let x = M + 4;
  doc.fontSize(9).font('Body');
  for (const b of boxes) {
    doc.rect(x, y, 10, 10).strokeColor(C.ink).lineWidth(0.8).stroke();
    doc.fillColor(C.ink).text(b, x + 15, y - 0.5, { width: 90 });
    x += 15 + doc.widthOfString(b) + 26;
  }
  doc.y = y + 14;
  // ligne commentaire
  const cy = doc.y + 6;
  doc.font('Body').fontSize(8.5).fillColor(C.mute).text('Commentaire :', M, doc.y, { continued: false });
  doc.moveTo(M + 70, cy + 4).lineTo(M + W, cy + 4).strokeColor(C.rule).lineWidth(0.8).stroke();
  doc.y = cy + 10;
  gap(rowGap);
}
// paragraphe "résumé" : intitulé gras + texte sur la même ligne
function leadP(label, text) {
  doc.font('Body').fontSize(9.6);
  const h = doc.heightOfString(label + text, { width: W });
  need(h + 2);
  const y = doc.y;
  doc.font('Body-Bold').fillColor(C.brand).text(label, M, y, { width: W, continued: true });
  doc.font('Body').fillColor(C.ink).text(text);
  gap(5);
}
// une phrase du répertoire : citation + sous-ligne statut/source
function phrase(text, statut, src) {
  const q = '« ' + text + ' »';
  const indent = 14, tw = W - indent;
  doc.font('Body').fontSize(9.6).fillColor(C.ink);
  const h = doc.heightOfString(q, { width: tw });
  need(h + 14);
  const y = doc.y;
  doc.font('Body-Bold').fillColor(C.brand).text('•', M, y, { width: indent });
  doc.font('Body').fillColor(C.ink).text(q, M + indent, y, { width: tw });
  const stCol = statut === 'validé' ? C.boxOkLine : (statut === 'proposé' ? '#2b6cb0' : C.mute);
  doc.font('Body-Italic').fontSize(8.3).fillColor(stCol).text('statut : ' + statut, M + indent, doc.y, { continued: true });
  doc.fillColor(C.mute).text('     source : ' + (src || '—'));
  gap(5);
}
// règle d'interdit : croix rouge + texte + source
function bulletSrc(t, src) {
  const indent = 14, tw = W - indent;
  doc.font('Body').fontSize(9.4).fillColor(C.ink);
  const h = doc.heightOfString(t, { width: tw });
  need(h + 12);
  const y = doc.y;
  doc.font('Body-Bold').fillColor(C.danger).text('×', M, y, { width: indent });
  doc.font('Body').fillColor(C.ink).text(t, M + indent, y, { width: tw });
  doc.font('Body-Italic').fontSize(8.3).fillColor(C.mute).text('source : ' + (src || '—'), M + indent, doc.y);
  gap(5);
}

// =====================================================================
//  EN-TÊTE / PAGE DE GARDE
// =====================================================================
doc.font('Body').fontSize(9).fillColor(C.mute)
  .text('Document de travail — confidentiel', M, M, { width: W, align: 'right' });
gap(6);
doc.font('Body-Bold').fontSize(26).fillColor(C.brand).text('Billy', M, doc.y, { width: W });
gap(2);
doc.font('Body-Bold').fontSize(15).fillColor(C.ink)
  .text('Dossier de validation clinique', { width: W });
gap(4);
doc.font('Body').fontSize(10.5).fillColor(C.mute).text(
  "À l'attention des professionnels de santé — pédopsychiatrie de la petite enfance, "
  + "pédiatrie, psychologie de l'enfant.", { width: W });
gap(10);
doc.font('Body').fontSize(9).fillColor(C.mute)
  .text('Version : brouillon de travail   ·   Statut : NON validé   ·   Cible : enfants de 2 à 5 ans', { width: W });
gap(12);
// ---- RÉSUMÉ EXÉCUTIF EN UNE PAGE, FORMAT IMRAD ----
const N_PHRASES = SCRIPT.phases.reduce((s, p) => s + ((p.items || []).length), 0);
doc.font('Body-Bold').fontSize(13.5).fillColor(C.brand).text('Résumé (format IMRAD)', M, doc.y, { width: W });
gap(3);
doc.moveTo(M, doc.y).lineTo(M + W, doc.y).strokeColor(C.boxWarnLine).lineWidth(1.2).stroke();
gap(8);
leadP('Introduction. ',
  "Les violences faites aux jeunes enfants sont sous-repérées, et un adulte non formé qui questionne "
  + "mal peut contaminer la parole de l'enfant (la rendant inexploitable) ou lui nuire. Billy vise à "
  + "aider à REPÉRER un enfant de 2-5 ans potentiellement victime, sans jamais l'interroger, et à "
  + "ORIENTER vers les professionnels. Il ne diagnostique pas et ne recueille pas le récit sensible.");
leadP('Méthodes. ',
  "Posture « Option A » (mise en confiance, ouverture neutre, repérage, orientation). Répertoire FERMÉ "
  + "de phrases pré-validées, distillé depuis des sources reconnues (NICHD 2021, Barnahus, Dr Salmona, "
  + "CRIAVS, CIIVISE, protegernosenfants, Guide VSM, NSPCC/RAINN/UNICEF) — chaque phrase tracée à sa "
  + "source ; filtre anti-suggestion (fail-closed) avant toute parole. Le présent dossier soumet ce "
  + "répertoire et l'approche à votre validation clinique.");
leadP('Résultats. ',
  "À ce jour : " + N_PHRASES + " phrases réparties en " + SCRIPT.phases.length + " phases (Annexe A), "
  + "des règles d'interdits et un circuit d'orientation (119, CRIP, procureur, UAPED), et un prototype "
  + "fonctionnel. Statut : BROUILLON — aucune phrase n'a encore le statut « validé ».");
leadP('Discussion. ',
  "Quatre décisions cliniques à trancher : (1) suggestibilité maximale à 2-5 ans → aucune question "
  + "fermée ; (2) dissociation → le rapport alerte au lieu de rassurer ; (3) faux positifs → un signal "
  + "exige comportement + critère, par âge ; (4) la parole d'un tout-petit n'est jamais une preuve → "
  + "verbatim brut, sans interprétation. Limites : non validé, et l'outil ne remplace pas un professionnel.");
gap(4);
callout('Ce que nous vous demandons',
  "Nous ne vous demandons pas d'approuver un produit fini, mais de corriger, contester et sécuriser "
  + "cliniquement chaque élément — phrase par phrase (Annexe A) puis via la grille de validation en fin "
  + "de dossier. Rien n'est dit à un enfant avant votre validation ; en cas de doute, on protège "
  + "l'enfant et on oriente vers l'humain.",
  'danger');
doc.addPage();

// =====================================================================
h2('1. Ce qu’est Billy — et ce qu’il n’est pas');
p("Billy est une application smartphone à intelligence artificielle vocale, incarnée par une "
  + "mascotte bienveillante (un écureuil). Tenu et opéré par l'adulte (le jeune enfant n'a pas "
  + "de téléphone et ne sait pas lire), il fonctionne en mains-libres, par la voix et l'image.");
h3('Sa fonction, en une phrase');
p("Aider à REPÉRER si un jeune enfant a pu subir une violence ou une agression — sans jamais "
  + "mener d'interrogatoire — puis ORIENTER vers les professionnels, et soutenir l'adulte.");
h3('Posture retenue (« Option A »)');
bullets([
  "Mise en confiance → ouverture la plus neutre possible → repérage de signaux → orientation.",
  "Billy n'investigue pas, ne qualifie pas, ne conclut pas, ne désigne aucun auteur.",
  "Le recueil du récit sensible reste à 100 % du ressort du professionnel humain.",
]);
callout('Billy n’est PAS',
  "un outil de diagnostic · une preuve judiciaire · un enquêteur · un substitut au professionnel · "
  + "un chatbot qui improvise ses phrases. Chaque énoncé possible est écrit, tracé et verrouillé à l'avance.",
  'warn');

// =====================================================================
h2('2. Pourquoi cet outil, et pourquoi ces précautions extrêmes');
p("Une IA mal conçue qui parle à un enfant de maltraitance peut nuire à l'enfant, détruire la "
  + "valeur judiciaire de sa parole (contamination) ou rater un signalement. La cible 2-5 ans est "
  + "le cas le plus délicat : suggestibilité maximale, langage et mémoire épisodique immatures, "
  + "confusion fréquente réel/imaginaire. C'est précisément pourquoi Billy ne recueille pas le récit "
  + "et se limite à mettre en confiance, repérer et orienter — avec un seuil d'orientation très bas.");

// =====================================================================
h2('3. Les fondements scientifiques et cliniques (et comment chacun a été utilisé)');
p("Billy n'invente rien. Chaque règle et chaque formulation est distillée depuis des références "
  + "reconnues, puis tracée jusqu'au fichier que lit l'application. Voici les sources, regroupées "
  + "par champ, et leur apport concret.", { gap: 8 });

h3('A. Audition non-suggestive de l’enfant');
source('Protocole NICHD (révision 2021)',
  "Socle de la méthode. Fournit la structure en phases d'une séance, la hiérarchie des questions "
  + "(invitations ouvertes > relance sur un mot déjà dit par l'enfant > questions ouvertes qui/quoi/où ; "
  + "questions fermées et suggestives proscrites), les règles de base (« je ne sais pas », « corrige-moi », "
  + "promesse de vérité), l'entraînement au récit sur un événement neutre, et la règle absolue : ne jamais "
  + "nommer un acte, une partie du corps, un lieu ou un auteur que l'enfant n'a pas nommé en premier.",
  "déroulé des phases de séance ; couche anti-suggestion qui filtre toute formulation suggestive ; "
  + "règle « Billy reprend les mots de l'enfant, n'invente rien ».");
source('Barnahus / PROMISE (standards européens)',
  "Modèle de la « maison des enfants » : un seul intervenant, des observateurs strictement passifs, "
  + "et un principe d'entretien unique (ne pas faire répéter l'enfant).",
  "second écran d'observation passive (lecture seule) ; règle « ne pas faire répéter ».");

h3('B. Clinique du psychotraumatisme — le point le plus important côté santé');
source('Dr Muriel Salmona — Mémoire Traumatique et Victimologie',
  "Apport décisif et contre-intuitif : un enfant gravement traumatisé peut sembler aller bien "
  + "(récit froid, distancié) du fait de la DISSOCIATION — il faut alors s'inquiéter DAVANTAGE, pas moins "
  + "(« davantage s'inquiéter pour ces victimes qui semblent indifférentes à leur sort »). L'adulte qui "
  + "écoute se dissocie aussi → « tout noter, ne pas rester seul ». Règle de vocabulaire : ne jamais nommer "
  + "l'auteur, surtout pas par un terme affectif (« ton papa », « ta nounou »). Principe : « plus les enfants "
  + "sont jeunes, plus le traumatisme est important ».",
  "le rapport ne présente jamais un récit calme comme rassurant — il le signale ; règle des termes affectifs "
  + "codée dans la couche anti-suggestion ; la préface destinée à l'adulte enseigne la dissociation et le « tout noter ».");

h3('C. Repères de développement — pour NE PAS sur-alerter');
source('CRIAVS Île-de-France — comportements sexuels de l’enfant',
  "Cadre « développement normal vs préoccupant » : un signal est un indice, pas un diagnostic ; « il n'y a "
  + "pas de norme ». Donne les critères qui font basculer normal → alerte (persistance malgré explication, "
  + "compulsivité, contrainte, écart d'âge de 5 ans ou plus, secret + déni, mise en danger, auto-blessure). "
  + "L'exploration de l'identité/orientation est classée NORMALE et ne doit pas déclencher de signal.",
  "logique de détection des signaux : exiger un comportement ET au moins un critère modulant, sur deux "
  + "niveaux (vigilance / orienter), indexée par âge — pour limiter les faux positifs.");

h3('D. Posture et orientation (cadre français)');
source('CIIVISE — livret « Mélissa et les autres » (2023) & rapport « On vous croit »',
  "Fonde la posture « repérer et orienter, ne pas enquêter » : « Signaler n'est pas enquêter ». Trois piliers : "
  + "croire / rassurer-déculpabiliser / orienter. Fournit, en verbatim, les phrases à dire et à ne pas dire à "
  + "l'enfant, et les amorces ouvertes non suggestives.",
  "répertoire des bonnes réactions (« je te crois », « ce n'est pas ta faute », « tu as bien fait d'en parler ») ; "
  + "liste des interdits ; questions d'ouverture ; orientation 119.");
source('protegernosenfants.fr · Guide parents VSM (Ville de Paris) · MIPROF · 119 · La Voix de l’Enfant (UAPED)',
  "Apportent les réflexes (écouter sans interrompre, noter les mots exacts et le contexte, ne pas confronter, "
  + "consulter un médecin, ne pas promettre le secret), les signaux d'alerte et les signes par âge, le tableau "
  + "« à privilégier / à éviter », et le circuit d'orientation (119, CRIP, procureur, UAPED).",
  "détection des signaux ; rapport verbatim avec contexte ; écran et préface parent ; bloc d'orientation et "
  + "réassurance + 119 imposés dès tout signal ; prise en charge médicale orientée vers les UAPED.");

h3('E. Apports internationaux');
source('NSPCC · RAINN · UNICEF · Stop It Now · Darkness to Light',
  "« Plusieurs petites conversations valent mieux qu'un grand entretien » (NSPCC) ; la révélation est souvent "
  + "indirecte, par indices → écouter les signaux faibles ; ne pas interpréter le calme comme une preuve d'absence "
  + "(RAINN, converge avec la dissociation) ; se mettre à hauteur de l'enfant (UNICEF).",
  "modèle multi-séances courtes ; répertoire de réassurance ; vigilance aux signaux faibles ; conseil à l'adulte "
  + "de surveiller sa propre expression (l'enfant lit le choc comme un reproche).");

// =====================================================================
h2('4. Les garde-fous non négociables');
bullets([
  "Aucun diagnostic, aucune preuve, aucun interrogatoire.",
  "Aucune question fermée ou suggestive ; ne jamais nommer un acte, un lieu ou un auteur avant l'enfant.",
  "Aucune pression, aucune récompense, on ne fait jamais répéter ; les silences sont respectés.",
  "Ne jamais promettre le secret à l'enfant.",
  "Seuil d'orientation très bas ; en cas de doute, on oriente. 119 systématiquement proposé.",
  "Données ultra-sensibles (mineur + santé + pénal) : minimisation, chiffrement, aucune donnée d'enfant en clair.",
  "Transparence : l'enfant sait que Billy est un programme, de façon adaptée à son âge.",
]);

// =====================================================================
h2('5. Ce que nous vous demandons de valider (par priorité clinique)');
bullets([
  "La POSTURE et les FORMULATIONS que Billy peut dire à l'enfant (le répertoire fermé, phase par phase).",
  "La FAISABILITÉ et la SÉCURITÉ de l'approche 2-5 ans — le point le plus sensible.",
  "La couche ANTI-SUGGESTION : les règles qui rendent une question suggestive impossible.",
  "La DÉTECTION des signaux et le seuil d'orientation (ni manqué, ni sur-alerte).",
  "L'ESCALADE et le RAPPORT : du signal à l'orientation, et un compte rendu transmissible, brut, sans interprétation.",
  "La gestion du conflit d'intérêts : l'adulte qui tient le téléphone peut être la personne en cause.",
]);

// =====================================================================
h2('6. Points cliniques sensibles que nous signalons nous-mêmes');
callout('Notre honnêteté sur les risques',
  "1) À 2-5 ans la suggestibilité est maximale : toute question fermée induit un faux positif — d'où "
  + "l'interdiction stricte. 2) La dissociation peut faire passer un enfant gravement traumatisé pour « calme » : "
  + "le rapport doit alerter, pas rassurer. 3) Le risque de faux positifs impose la logique « comportement + critère, "
  + "par âge ». 4) La parole d'un 2-5 ans n'est jamais une preuve : le rapport consigne des observations et un "
  + "verbatim brut, sans qualification ni conclusion. Nous attendons votre avis sur chacun de ces points.",
  'warn');

// =====================================================================
//  ANNEXE A — répertoire complet (généré depuis script-billy.json)
doc.addPage();
h1('Annexe A — Répertoire complet des phrases');
p("Voici l'INTÉGRALITÉ des phrases que Billy peut prononcer, telles qu'elles figurent dans le fichier "
  + "source de l'application (script-billy.json, version " + ((SCRIPT.meta && SCRIPT.meta.version) || '—') + "). "
  + "Chaque phrase est tracée jusqu'à sa source. Statuts : brouillon / proposé / validé / à revoir. "
  + "Aucune n'est aujourd'hui « validé » — c'est précisément ce répertoire que nous vous demandons de "
  + "relire ligne à ligne et d'amender.", { gap: 8 });

for (const ph of SCRIPT.phases) {
  h3(san(ph.id + ' — ' + ph.titre));
  for (const it of (ph.items || [])) phrase(san(it.formulation), san(it.statut), san(it.source));
  gap(2);
}

h2('Ce que Billy ne dit JAMAIS (interdits)');
for (const r of ((SCRIPT.interdits && SCRIPT.interdits.regles) || [])) bulletSrc(san(r.regle), san(r.source));

h2('Orientation présentée à l’adulte');
for (const n of ((SCRIPT.orientation && SCRIPT.orientation.niveaux) || [])) {
  p(san('• ' + n.niveau + ' : ' + n.action), { gap: 3 });
}
if (SCRIPT.orientation && SCRIPT.orientation.note) {
  p(san(SCRIPT.orientation.note), { font: 'Body-Italic', color: C.mute, size: 9, gap: 6 });
}

// =====================================================================
doc.addPage();
h1('Grille de validation à compléter');
p("Le répertoire complet des phrases figure en Annexe A. Pour chaque élément ci-dessous : cochez "
  + "Validé / À corriger / Refusé, et précisez en commentaire. Vos corrections sont prioritaires sur "
  + "toute considération de produit.", { gap: 10 });

checkboxRow("1. Posture générale (Option A : repérer et orienter, sans recueil ni investigation).");
checkboxRow("2. Formulations dites à l'enfant — mise en confiance et ouverture neutre.");
checkboxRow("3. Formulations de réaction après un signal (« je te crois », « ce n'est pas ta faute »…).");
checkboxRow("4. Adaptation 2-5 ans (langage, rythme, séances courtes, non-lecteur, mains-libres).");
checkboxRow("5. Couche anti-suggestion (jamais nommer un acte/lieu/auteur ; pas de question fermée ; termes affectifs).");
checkboxRow("6. Détection des signaux et seuil d'orientation (faux négatifs vs faux positifs).");
checkboxRow("7. Gestion de la dissociation dans le rapport (ne pas présenter le calme comme rassurant).");
checkboxRow("8. Escalade et orientation (119, CRIP, procureur, UAPED, médecin).");
checkboxRow("9. Contenu et forme du rapport transmissible (observations + verbatim brut, sans interprétation).");
checkboxRow("10. Conflit d'intérêts : adulte tenant le téléphone potentiellement mis en cause.");

gap(6); rule();
h3('Avis global');
const gy = doc.y;
doc.font('Body').fontSize(9).fillColor(C.ink);
['Favorable', 'Favorable sous réserve des corrections', 'Défavorable en l’état'].forEach((b, i) => {
  const yy = gy + i * 16;
  doc.rect(M + 2, yy, 10, 10).strokeColor(C.ink).lineWidth(0.8).stroke();
  doc.fillColor(C.ink).text(b, M + 18, yy - 0.5, { width: W - 18 });
});
doc.y = gy + 3 * 16 + 8;
gap(10);

h3('Identité du professionnel');
function fieldLine(label) {
  need(24);
  const y = doc.y + 4;
  doc.font('Body').fontSize(9.5).fillColor(C.ink).text(label, M, y, { lineBreak: false });
  const lx = M + 140;
  doc.moveTo(lx, y + 9).lineTo(M + W, y + 9).strokeColor(C.rule).lineWidth(0.8).stroke();
  doc.y = y + 18;
}
fieldLine('Nom / prénom :');
fieldLine('Spécialité / fonction :');
fieldLine('Structure :');
fieldLine('Date :');
fieldLine('Signature :');

// =====================================================================
doc.addPage();
h2('Sources citées');
const srcs = [
  ['NICHD — protocole révisé 2021', 'nichdprotocol.com/the-nichd-protocol (REVISED_VERSION_2021.pdf)'],
  ['Barnahus / PROMISE — Quality Standards', 'barnahus.eu (PROMISE-Barnahus-Quality-Standards.pdf)'],
  ['CIIVISE — livret « Mélissa et les autres » (2023) & rapport « On vous croit »', 'ciivise.fr'],
  ['MIPROF / arretonslesviolences.gouv.fr', 'arretonslesviolences.gouv.fr/je-suis-temoin/que-faire-quand-la-victime-se-confie'],
  ['119 — Allô Enfance en Danger', 'allo119.gouv.fr'],
  ['protegernosenfants.fr', 'protegernosenfants.fr'],
  ['Guide à destination des parents (VSM) — Ville de Paris (mars 2026)', 'document Ville de Paris'],
  ['CN2R — accueillir et recueillir la parole de l’enfant', 'cn2r.fr'],
  ['La Voix de l’Enfant — UAPED', 'lavoixdelenfant.org'],
  ['CRIAVS Île-de-France — comportements sexuels des enfants', 'violences-sexuelles.info'],
  ['Mémoire Traumatique et Victimologie / Dr M. Salmona', 'memoiretraumatique.org'],
  ['NSPCC (UK)', 'learning.nspcc.org.uk'],
  ['RAINN (US)', 'rainn.org'],
  ['Stop It Now / Darkness to Light / UNICEF', 'stopitnow.org · d2l.org · unicef.org'],
];
doc.font('Body').fontSize(9.2);
for (const [n, u] of srcs) {
  const txt = n + '  —  ' + u;
  const hh = doc.heightOfString(txt, { width: W - 14 });
  need(hh + 4);
  const y = doc.y;
  doc.font('Body-Bold').fillColor(C.brand).text('•', M, y, { width: 12 });
  doc.font('Body').fillColor(C.ink).text(n, M + 12, y, { width: W - 12, continued: true })
     .fillColor(C.mute).text('  —  ' + u);
  gap(4);
}
gap(8);
callout('Rappel',
  "Cette compilation est un document de travail. Aucune source ne vaut caution professionnelle, et aucune "
  + "phrase n'est dite à un enfant tant que des professionnels (pédopsychiatrie petite enfance, audition/NICHD, "
  + "juriste/magistrat, associations) ne l'ont pas validée. Les passages entre guillemets sont des verbatim ; le "
  + "reste est une synthèse susceptible d'erreur.", 'danger');

// ---- pieds de page (numérotation) ----
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(range.start + i);
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;            // empêche pdfkit d'ajouter une page en écrivant dans la marge basse
  const fy = doc.page.height - 34;
  doc.font('Body').fontSize(8).fillColor(C.mute);
  doc.text('Billy — Dossier de validation clinique (brouillon non validé)', M, fy, { lineBreak: false });
  doc.text((i + 1) + ' / ' + range.count, M + W - 60, fy, { width: 60, align: 'right', lineBreak: false });
  doc.page.margins.bottom = oldBottom;
}

doc.end();
console.log('PDF généré : ' + OUT);
