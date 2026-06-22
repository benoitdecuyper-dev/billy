// Billy — serveur : statique + API d'appairage (QR) + signalisation WebRTC (2e téléphone).
// Démarre en HTTP (localhost) ET en HTTPS auto-signé (pour tester la caméra sur de vrais
// téléphones en LAN — les navigateurs exigent https hors localhost). Cf. docs/roadmap-V2.md.

import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';
import selfsigned from 'selfsigned';
import { streamReportPdf, streamConsolidatedPdf } from '../report/generatePdf.js';
import { buildConsolidated } from '../report/consolidate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const PORT = Number(process.env.PORT) || 3000;
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf',
};

// --- Salles d'appairage (token éphémère) ---
const rooms = new Map(); // token -> { broadcaster: ws|null, observers: Set<ws>, createdAt }
const ROOM_TTL_MS = 10 * 60 * 1000;
function makeRoom() {
  const token = crypto.randomBytes(8).toString('hex');
  rooms.set(token, { broadcaster: null, observers: new Set(), createdAt: Date.now() });
  return token;
}
setInterval(() => {
  const now = Date.now();
  for (const [t, r] of rooms) if (now - r.createdAt > ROOM_TTL_MS && !r.broadcaster && r.observers.size === 0) rooms.delete(t);
}, 60000).unref?.();

// --- Gestion des requêtes HTTP (partagée http + https) ---
async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size }));
    return;
  }
  if (url.pathname === '/api/room') {
    const token = makeRoom();
    const scheme = req.socket.encrypted ? 'https' : 'http';
    const childUrl = `${scheme}://${req.headers.host}/seance.html?room=${token}`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token, childUrl }));
    return;
  }
  if (url.pathname === '/api/qr') {
    const text = url.searchParams.get('text') || '';
    try {
      const png = await QRCode.toBuffer(text, { width: 320, margin: 1, color: { dark: '#4f4438', light: '#ffffff' } });
      res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(png);
    } catch { res.writeHead(400); res.end('bad qr'); }
    return;
  }

  // Voix en direct (Text-to-Speech). Prête pour ElevenLabs ; sans clé -> 501 (le client bascule
  // sur la voix du navigateur). En prod : définir ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID.
  // Audit M1 : le texte (qui reprend le MOT de l'enfant) passe en POST/body, jamais en URL —
  // pour ne pas fuiter de verbatim dans les access-logs/proxies/historique.
  if (url.pathname === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', async () => {
      let text = ''; try { text = String(JSON.parse(body).text || '').slice(0, 500); } catch {}
      const key = process.env.ELEVENLABS_API_KEY, voice = process.env.ELEVENLABS_VOICE_ID;
      if (!key || !voice || !text) { res.writeHead(501, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'no_tts' })); return; }
      try {
        const up = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
          method: 'POST',
          headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.8 } }),
        });
        if (!up.ok) { res.writeHead(502); res.end('tts upstream'); return; }
        const buf = Buffer.from(await up.arrayBuffer());
        res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' }); res.end(buf);
      } catch { res.writeHead(502); res.end('tts error'); }
    });
    return;
  }

  // Rapport de séance en PDF (généré à partir de l'échange transmis). Données sensibles :
  // rien n'est stocké côté serveur, le PDF est renvoyé puis oublié.
  if (url.pathname === '/api/report' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      let session; try { session = JSON.parse(body); } catch { res.writeHead(400); res.end('bad json'); return; }
      res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="rapport-billy.pdf"', 'Cache-Control': 'no-store' });
      try { streamReportPdf(session, res); } catch { try { res.end(); } catch {} }
    });
    return;
  }

  // Rapport CONSOLIDÉ multi-sessions en PDF (BILLY-112). Données sensibles : rien n'est
  // stocké côté serveur. Le périmètre RGPD est garanti par buildConsolidated (BILLY-113).
  if (url.pathname === '/api/report/consolidated' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 4e6) req.destroy(); });
    req.on('end', () => {
      let payload; try { payload = JSON.parse(body); } catch { res.writeHead(400); res.end('bad json'); return; }
      const sessions = Array.isArray(payload) ? payload : payload.sessions;
      let consolidated; try { consolidated = buildConsolidated(sessions); } catch { res.writeHead(400); res.end('bad sessions'); return; }
      res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="rapport-consolide-billy.pdf"', 'Cache-Control': 'no-store' });
      try { streamConsolidatedPdf(consolidated, res); } catch { try { res.end(); } catch {} }
    });
    return;
  }

  // Sert les VRAIS modules (testés) au front-end (anti-suggestion, état/store, consolidation).
  if (url.pathname.startsWith('/lib/')) {
    const LIB = {
      'antiSuggestion.js': '../safety/antiSuggestion.js',
      'navState.js': '../session/navState.js',
      'secureStore.js': '../session/secureStore.js',
      'sessionMeta.js': '../session/sessionMeta.js',
      'consolidate.js': '../report/consolidate.js',
    };
    const rel = LIB[url.pathname.slice('/lib/'.length)];
    if (rel) {
      try {
        const data = await readFile(path.resolve(__dirname, rel));
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); res.end(data); return;
      } catch { /* tombe en 404 */ }
    }
    res.writeHead(404); res.end('not found'); return;
  }

  const urlPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found');
  }
}

// --- Signalisation WebRTC (RELAIS PUR ; observateurs passifs) ---
function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function obsById(room, id) { for (const o of room.observers) if (o._id === id) return o; return null; }

function handleConnection(ws, req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('room');
  const role = url.searchParams.get('role'); // 'broadcaster' (enfant) | 'observer' (adulte)
  const room = token && rooms.get(token);
  if (!room || (role !== 'broadcaster' && role !== 'observer')) { send(ws, { type: 'error', reason: 'room/role invalide' }); ws.close(); return; }

  ws._role = role; ws._id = crypto.randomBytes(6).toString('hex');
  if (role === 'broadcaster') {
    room.broadcaster = ws;
    for (const obs of room.observers) send(ws, { type: 'peer-ready', obsId: obs._id });
  } else {
    room.observers.add(ws);
    if (room.broadcaster) send(room.broadcaster, { type: 'peer-ready', obsId: ws._id });
  }

  ws.on('message', (buf) => {
    let msg; try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (!['offer', 'answer', 'ice'].includes(msg.type)) return; // relais pur
    if (role === 'broadcaster') { const obs = obsById(room, msg.to); if (obs) send(obs, msg); }
    else { send(room.broadcaster, { ...msg, from: ws._id }); } // observateur -> diffuseur uniquement
  });
  ws.on('close', () => {
    if (role === 'broadcaster') { room.broadcaster = null; for (const obs of room.observers) send(obs, { type: 'peer-left' }); }
    else { room.observers.delete(ws); send(room.broadcaster, { type: 'peer-left', obsId: ws._id }); }
  });
}

function lanIPs() {
  const out = [];
  for (const ifs of Object.values(os.networkInterfaces())) for (const i of ifs || [])
    if (i.family === 'IPv4' && !i.internal) out.push(i.address);
  return out;
}

// --- HTTP (localhost) ---
const httpServer = http.createServer(handler);
new WebSocketServer({ server: httpServer, path: '/signal' }).on('connection', handleConnection);
httpServer.listen(PORT, () => console.log(`HTTP  : http://localhost:${PORT}`));

// --- HTTPS auto-signé (pour de vrais téléphones en LAN) ---
try {
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'billy.local' }], { days: 365, keySize: 2048, algorithm: 'sha256' });
  const httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, handler);
  new WebSocketServer({ server: httpsServer, path: '/signal' }).on('connection', handleConnection);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS : https://localhost:${HTTPS_PORT}  (certificat auto-signé)`);
    for (const ip of lanIPs()) console.log(`        sur le réseau : https://${ip}:${HTTPS_PORT}`);
  });
} catch (e) { console.log('HTTPS désactivé :', e.message); }
