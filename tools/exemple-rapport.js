/*
 * Génère un EXEMPLE de rapport de séance (.docx) à partir d'un échange NEUTRE fictif,
 * pour visualiser le rendu. Aucune donnée réelle, aucun contenu sensible.
 * Lancer : node tools/exemple-rapport.js
 */
import { writeReportDocx, writeDemarcheDocx } from '../src/report/generateReport.js';

const exemple = {
  date: '21 juin 2026',
  debut: '14h02',
  fin: '14h09',
  duree: '7 minutes',
  enfant: { prenom: 'Léa', age: '8 ans' },
  version: 'script-billy v0.1 (brouillon)',
  tours: [
    { heure: '14:02', acteur: 'Billy', texte: "Coucou, moi c'est Billy. Je suis un personnage sur ton téléphone, je ne suis pas une vraie personne." },
    { heure: '14:03', acteur: 'Billy', texte: "Si tu veux qu'on s'arrête, tu me le dis. C'est toi qui décides." },
    { heure: '14:03', acteur: 'Billy', texte: "Pour faire connaissance, raconte-moi ta journée d'hier. Prends ton temps." },
    { heure: '14:04', acteur: 'Enfant', texte: "Hier je me suis réveillée, j'ai mangé des céréales et après je suis allée à l'école." },
    { heure: '14:04', acteur: 'Billy', texte: "Et après, qu'est-ce qui s'est passé ?" },
    { heure: '14:05', acteur: 'Enfant', texte: "À la récré j'ai joué à la marelle avec Inès, et l'après-midi on a fait du dessin." },
    { heure: '14:06', acteur: 'Billy', texte: "Dis-m'en plus." },
    { heure: '14:06', acteur: 'Enfant', texte: "Le soir on a mangé des pâtes et j'ai regardé un dessin animé avant de dormir." },
    { heure: '14:08', acteur: 'Billy', texte: "Merci de m'avoir parlé. J'étais contente de t'écouter." },
  ],
  recap: [
    "L'enfant a décrit une journée ordinaire : réveil, petit-déjeuner, école.",
    "À la récréation : a joué à la marelle avec « Inès ».",
    "Après-midi : activité dessin. Soir : repas (pâtes) puis dessin animé avant le coucher.",
  ],
  signaux: [], // échange neutre : aucun signal
  orientation: [
    { niveau: 'Danger immédiat', action: '17 / 112 (ou 15 / 18 si blessé)' },
    { niveau: 'Réflexe principal', action: '119 — gratuit, 24h/24, confidentiel (tchat sur allo119.gouv.fr), même en cas de doute' },
    { niveau: 'Avis médical', action: 'médecin traitant / urgences pédiatriques / UAPED' },
    { niveau: 'Institutionnel', action: 'CRIP (information préoccupante) ; procureur (signalement) — via le 119 ou un professionnel' },
  ],
};

Promise.all([
  writeReportDocx(exemple, 'docs/Rapport_Billy_exemple.docx'),
  writeDemarcheDocx(exemple, 'docs/Demarche_Billy_exemple.docx'),
]).then(([a, b]) => console.log('Écrits :', a, '+', b));
