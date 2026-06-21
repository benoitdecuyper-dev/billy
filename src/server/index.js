// Billy — serveur : statique + API d'appairage (QR) + signalisation WebRTC (2e téléphone).
// V2 : permet à un/des appareil(s) OBSERVATEUR(S) de suivre en direct l'audio/vidéo de la
// séance, sans JAMAIS pouvoir interférer (relais passif). Cf. docs/roadmap-V2.md (V2-2).

import http from 'node:http';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const PORT = process.env.PORT || 3000;

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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size }));
    return;
  }

  // Crée une salle, renvoie le token + l'URL enfant (basée sur l'hôte utilisé par l'adulte → scannable en LAN)
  if (url.pathname === '/api/room') {
    const token = makeRoom();
    const childUrl = `${url.protocol}//${req.headers.host}/seance.html?room=${token}`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token, childUrl }));
    return;
  }

  // QR PNG d'un texte (l'URL enfant)
  if (url.pathname === '/api/qr') {
    const text = url.searchParams.get('text') || '';
    try {
      const png = await QRCode.toBuffer(text, { width: 320, margin: 1, color: { dark: '#4f4438', light: '#ffffff' } });
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(png);
    } catch { res.writeHead(400); res.end('bad qr'); }
    return;
  }

  // Statique
  const urlPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(PUBLIC_DIR, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

// --- Signalisation WebRTC (relais pur) ---
const wss = new WebSocketServer({ server, path: '/signal' });

function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }

function obsById(room, id) { for (const o of room.observers) if (o._id === id) return o; return null; }

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('room');
  const role = url.searchParams.get('role'); // 'broadcaster' (enfant) | 'observer' (adulte)
  const room = token && rooms.get(token);
  if (!room || (role !== 'broadcaster' && role !== 'observer')) { send(ws, { type: 'error', reason: 'room/role invalide' }); ws.close(); return; }

  ws._role = role; ws._token = token; ws._id = crypto.randomBytes(6).toString('hex');

  if (role === 'broadcaster') {
    room.broadcaster = ws;
    // diffuseur arrive : pour chaque observateur déjà présent, demander une négociation
    for (const obs of room.observers) send(ws, { type: 'peer-ready', obsId: obs._id });
  } else {
    room.observers.add(ws);
    if (room.broadcaster) send(room.broadcaster, { type: 'peer-ready', obsId: ws._id });
  }

  ws.on('message', (buf) => {
    let msg; try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (!['offer', 'answer', 'ice'].includes(msg.type)) return; // RELAIS PUR (rien d'autre)
    if (role === 'broadcaster') {
      // diffuseur -> un observateur ciblé (msg.to = obsId)
      const obs = obsById(room, msg.to);
      if (obs) send(obs, msg);
    } else {
      // observateur -> diffuseur uniquement ; jamais vers un autre observateur (passif)
      send(room.broadcaster, { ...msg, from: ws._id });
    }
  });

  ws.on('close', () => {
    if (role === 'broadcaster') { room.broadcaster = null; for (const obs of room.observers) send(obs, { type: 'peer-left' }); }
    else { room.observers.delete(ws); send(room.broadcaster, { type: 'peer-left', obsId: ws._id }); }
  });
});

server.listen(PORT, () => console.log(`Billy à l'écoute sur http://localhost:${PORT}`));
