/*
 * BILLY-104 — Persistance LOCALE et CHIFFRÉE de l'état inter-sessions.
 * Réf. docs/V2-multi-seances_PO.md §6.2 (AES-256 au repos, clé dérivée du code parental).
 *
 * Garanties :
 *  - On ne persiste QUE de la navigation : assertNoContent() est appliqué AVANT chiffrement
 *    ET APRÈS déchiffrement. Aucun verbatim/émotion ne peut entrer dans le store (fail-closed).
 *  - Chiffrement AES-GCM 256 bits, clé dérivée du CODE PARENTAL via PBKDF2-SHA256 (100k).
 *    Sans le code parental, l'état est indéchiffrable (et la clé n'est jamais stockée).
 *  - Purge = suppression du blob : les données deviennent irrécupérables (sel + IV + cipher
 *    sont l'unique copie ; rien d'autre ne permet de les reconstituer).
 *  - Environnement-agnostique : utilise globalThis.crypto (Node ≥ 20 et navigateurs).
 *    Le « storage » est injecté (localStorage côté navigateur, Map côté tests/serveur).
 */

'use strict';

import { assertNoContent } from './navState.js';

const STORAGE_KEY = 'billy.navstate.v1';
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

/** Chiffre et persiste l'état (navigation uniquement). Lève si du contenu a fui. */
export async function saveState(storage, parentalCode, state) {
  assertNoContent(state); // périmètre §4.1 garanti AVANT de chiffrer quoi que ce soit
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(parentalCode, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(state));
  const cipher = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  storage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, salt: b64(salt), iv: b64(iv), ct: b64(cipher) }));
  return true;
}

/**
 * Charge et déchiffre l'état. Renvoie null s'il n'y a rien.
 * Lève (fail-closed) si le code parental est erroné ou le blob altéré.
 */
export async function loadState(storage, parentalCode) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const { salt, iv, ct } = JSON.parse(raw);
  const key = await deriveKey(parentalCode, ub64(salt));
  let plainBuf;
  try {
    plainBuf = await subtle().decrypt({ name: 'AES-GCM', iv: ub64(iv) }, key, ub64(ct));
  } catch {
    throw new Error('secureStore: déchiffrement impossible (code parental erroné ou données altérées)');
  }
  const state = JSON.parse(new TextDecoder().decode(plainBuf));
  return assertNoContent(state); // re-vérifie le périmètre APRÈS déchiffrement
}

/** Purge complète et irréversible du dossier (BILLY-104 critère d). */
export function purge(storage) {
  storage.removeItem(STORAGE_KEY);
  return true;
}

/** Adaptateur navigateur : à passer comme « storage » côté PWA. */
export function localStorageAdapter() {
  return globalThis.localStorage;
}

export { STORAGE_KEY };
