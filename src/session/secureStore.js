/*
 * BILLY-104 — Persistance LOCALE et CHIFFRÉE de l'état inter-sessions + métadonnées de séances.
 * Réf. docs/V2-multi-seances_PO.md §6.2 (AES-256 au repos, clé dérivée du code parental).
 *
 * Garanties :
 *  - On ne persiste QUE de la navigation / des métadonnées : un validateur est appliqué AVANT
 *    chiffrement ET APRÈS déchiffrement. Aucun verbatim/émotion ne peut entrer (fail-closed).
 *  - Chiffrement AES-GCM 256 bits, clé dérivée du CODE PARENTAL via PBKDF2-SHA256 (100k).
 *    Sans le code parental, le store est indéchiffrable (la clé n'est jamais stockée).
 *  - Purge = suppression du blob : données irrécupérables (sel + IV + cipher = unique copie).
 *  - Environnement-agnostique : globalThis.crypto (Node ≥ 20 + navigateurs) ; storage injecté.
 */

'use strict';

import { assertNoContent } from './navState.js';
import { assertSessionMetaList } from './sessionMeta.js';

const STATE_KEY = 'billy.navstate.v1';
const SESSIONS_KEY = 'billy.sessions.v1';
const PBKDF2_ITER = 100000;

const subtle = () => globalThis.crypto.subtle;

/* --- base64 portable (btoa/atob présents sous Node ≥ 16 et navigateurs) --- */
function b64(bytes) {
  let s = '';
  for (const byte of bytes) s += String.fromCharCode(byte);
  return globalThis.btoa(s);
}
function ub64(str) {
  const bin = globalThis.atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(parentalCode, salt) {
  if (typeof parentalCode !== 'string' || parentalCode.length < 4)
    throw new Error('secureStore: code parental requis (≥ 4 caractères)');
  const baseKey = await subtle().importKey(
    'raw', new TextEncoder().encode(parentalCode), 'PBKDF2', false, ['deriveKey'],
  );
  return subtle().deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // clé non exportable
    ['encrypt', 'decrypt'],
  );
}

/* --- Primitives chiffrées génériques (le périmètre est garanti par l'appelant) --- */
async function encryptTo(storage, parentalCode, storageKey, data) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(parentalCode, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const cipher = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  storage.setItem(storageKey, JSON.stringify({ v: 1, salt: b64(salt), iv: b64(iv), ct: b64(cipher) }));
  return true;
}
async function decryptFrom(storage, parentalCode, storageKey) {
  const raw = storage.getItem(storageKey);
  if (!raw) return null;
  const { salt, iv, ct } = JSON.parse(raw);
  const key = await deriveKey(parentalCode, ub64(salt));
  try {
    const plainBuf = await subtle().decrypt({ name: 'AES-GCM', iv: ub64(iv) }, key, ub64(ct));
    return JSON.parse(new TextDecoder().decode(plainBuf));
  } catch {
    throw new Error('secureStore: déchiffrement impossible (code parental erroné ou données altérées)');
  }
}

/* --- État de navigation inter-sessions (périmètre = assertNoContent) --- */
export async function saveState(storage, parentalCode, state) {
  assertNoContent(state); // périmètre §4.1 garanti AVANT de chiffrer
  return encryptTo(storage, parentalCode, STATE_KEY, state);
}
export async function loadState(storage, parentalCode) {
  const data = await decryptFrom(storage, parentalCode, STATE_KEY);
  return data == null ? null : assertNoContent(data); // re-vérifie APRÈS déchiffrement
}

/* --- Métadonnées de séances (périmètre = assertSessionMetaList) --- */
export async function saveSessions(storage, parentalCode, list) {
  assertSessionMetaList(list);
  return encryptTo(storage, parentalCode, SESSIONS_KEY, list);
}
export async function loadSessions(storage, parentalCode) {
  const data = await decryptFrom(storage, parentalCode, SESSIONS_KEY);
  return data == null ? null : assertSessionMetaList(data);
}

/* --- Purge --- */
/** Purge l'état de navigation. */
export function purge(storage) {
  storage.removeItem(STATE_KEY);
  return true;
}
/** Purge TOUT le dossier (état + métadonnées de séances) — irréversible (BILLY-104 / BILLY-111). */
export function purgeAll(storage) {
  storage.removeItem(STATE_KEY);
  storage.removeItem(SESSIONS_KEY);
  return true;
}

/** Adaptateur navigateur : à passer comme « storage » côté PWA. */
export function localStorageAdapter() {
  return globalThis.localStorage;
}

export { STATE_KEY, SESSIONS_KEY };
// Rétro-compat : ancien nom de la clé d'état.
export { STATE_KEY as STORAGE_KEY };
