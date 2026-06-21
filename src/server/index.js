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

  // Sert le VRAI module anti-suggestion (testé) au prototype temps réel.
  if (url.pathname === '/lib/antiSuggestion.js') {
    try {
      const data = await readFile(path.resolve(__dirname, '../safety/antiSuggestion.js'));
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); res.end(data);
    } catch { res.writeHead(404); res.end('not found'); }
    return;
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
