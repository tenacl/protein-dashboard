#!/usr/bin/env node
// Encrypt a weight value for the dashboard. AES-GCM, key = PBKDF2(passphrase, salt).
// Mirrors the browser decrypt code in index.html exactly.
//
// Usage:
//   PASSPHRASE="...." node tools/encrypt-weight.mjs <date> <weightKg>
//   e.g. PASSPHRASE="secret" node tools/encrypt-weight.mjs 2026-06-15 88.4
//
// Appends/updates the entry in data/weight-log.json (does NOT commit/push).
import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PBKDF2_ITERS = 250000;
const enc = new TextEncoder();

async function deriveKey(passphrase, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

function b64(buf) { return Buffer.from(buf).toString('base64'); }

async function encryptWeight(passphrase, plaintext) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return `${b64(salt)}:${b64(iv)}:${b64(new Uint8Array(ct))}`;
}

const [date, weight] = process.argv.slice(2);
const passphrase = process.env.PASSPHRASE;
if (!passphrase || !date || !weight) {
  console.error('Usage: PASSPHRASE="..." node tools/encrypt-weight.mjs <YYYY-MM-DD> <weightKg>');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const logPath = join(here, '..', 'data', 'weight-log.json');
const log = JSON.parse(readFileSync(logPath, 'utf8'));

const payload = await encryptWeight(passphrase, String(weight));
const existing = log.entries.find((e) => e.date === date);
if (existing) existing.payload = payload;
else log.entries.push({ date, payload });
log.entries.sort((a, b) => a.date.localeCompare(b.date));

writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
console.log(`encrypted weight for ${date} -> ${weight}kg (stored, not committed)`);
