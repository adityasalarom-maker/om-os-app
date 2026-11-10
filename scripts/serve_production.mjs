#!/usr/bin/env node
/**
 * ॐ Om Knowledge OS — Zero-Dependency Production Static Web Server
 * 
 * High-performance, production HTTP server for desktop & Samsung Galaxy S25 Ultra.
 * Features:
 * - Zero external npm dependencies (uses native Node.js http, fs, path, os)
 * - Single Page Application (SPA) routing fallback to /index.html
 * - RFC-compliant MIME types (.html, .js, .mjs, .css, .json, .svg, .wasm, .webp)
 * - Intelligent cache headers (immutable hashed assets vs no-cache sw.js/manifest)
 * - Automatic Wi-Fi / LAN IP discovery for instant mobile connectivity
 */

import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const notesSyncEnabled = process.env.OM_NOTES_PRO_SYNC === '1' || process.argv.includes('--enable-notes-pro-sync');
const appDataRoot = process.env.LOCALAPPDATA || process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
const notesSyncDir = path.join(appDataRoot, 'OmKnowledgeOS', 'NotesStudioProSync');
const notesSyncStorePath = path.join(notesSyncDir, 'vault-encrypted.json');
const notesSyncTokenPath = path.join(notesSyncDir, 'pairing-token.txt');
const notesSyncRoute = '/api/notes-studio-pro/sync';
const notesSyncMaxBodyBytes = 12 * 1024 * 1024;
let notesSyncToken = '';
let notesSyncWriteQueue = Promise.resolve();
const notesSyncUsedNonces = new Map();

function isPrivatePeer(address = '') {
  let normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) normalized = normalized.slice(7);
  if (normalized === '::1' || normalized === 'localhost') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')) return true;
  const pieces = normalized.split('.').map(Number);
  if (pieces.length !== 4 || pieces.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return pieces[0] === 10 || pieces[0] === 127 ||
    (pieces[0] === 192 && pieces[1] === 168) ||
    (pieces[0] === 172 && pieces[1] >= 16 && pieces[1] <= 31) ||
    (pieces[0] === 169 && pieces[1] === 254);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > notesSyncMaxBodyBytes) throw Object.assign(new Error('Request is too large.'), { statusCode: 413 });
    chunks.push(chunk);
  }
  try {
    const raw = Buffer.concat(chunks);
    return { payload: JSON.parse(raw.toString('utf8')), raw };
  } catch {
    throw Object.assign(new Error('Invalid JSON request.'), { statusCode: 400 });
  }
}

async function readNotesSyncStore() {
  try {
    const stored = JSON.parse(await fs.promises.readFile(notesSyncStorePath, 'utf8'));
    if (!Number.isSafeInteger(stored.version) || !Array.isArray(stored.snapshots)) throw new Error('Invalid sync store.');
    return { ...stored, clients: stored.clients && typeof stored.clients === 'object' && !Array.isArray(stored.clients) ? stored.clients : {} };
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 0, snapshots: [], clients: {} };
    throw error;
  }
}

async function writeNotesSyncStore(store) {
  await fs.promises.mkdir(notesSyncDir, { recursive: true });
  const tempPath = `${notesSyncStorePath}.${process.pid}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(store), { encoding: 'utf8', mode: 0o600 });
  await fs.promises.rename(tempPath, notesSyncStorePath);
}

function getNotesSyncClient(req) {
  const id = String(req.headers['x-notes-client-id'] || '');
  const platform = String(req.headers['x-notes-client-platform'] || '');
  if (!id && !platform) return null; // Backward compatible with older installed clients.
  if (!/^[A-Za-z0-9._:-]{1,100}$/.test(id) || !['desktop', 'android'].includes(platform)) return false;
  return { id, platform };
}

function recordNotesSyncClient(store, client) {
  if (!client) return store;
  store.clients ||= {};
  store.clients[client.id] = { platform: client.platform, lastSeenAt: new Date().toISOString() };
  return store;
}

function isValidEncryptedEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object' || envelope.format !== 'om-notes-pro-e2e-v1') return false;
  return typeof envelope.salt === 'string' && /^[A-Za-z0-9_-]{20,32}$/.test(envelope.salt) &&
    typeof envelope.iv === 'string' && /^[A-Za-z0-9_-]{16}$/.test(envelope.iv) &&
    typeof envelope.ciphertext === 'string' && /^[A-Za-z0-9_-]+$/.test(envelope.ciphertext) &&
    envelope.ciphertext.length <= notesSyncMaxBodyBytes;
}

function verifyNotesSyncRequest(req, rawBody = Buffer.alloc(0)) {
  const timestamp = req.headers['x-notes-timestamp'] || '';
  const nonce = req.headers['x-notes-nonce'] || '';
  const signature = req.headers['x-notes-signature'] || '';
  const timestampNumber = Number(timestamp);
  if (!/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - timestampNumber) > 60_000 ||
      !/^[A-Za-z0-9_-]{20,40}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;
  for (const [usedNonce, expiresAt] of notesSyncUsedNonces) if (expiresAt <= Date.now()) notesSyncUsedNonces.delete(usedNonce);
  if (notesSyncUsedNonces.has(nonce)) return false;
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('base64url');
  const expectedVersion = req.headers['if-match'] || '';
  const clientId = req.headers['x-notes-client-id'] || '';
  const clientPlatform = req.headers['x-notes-client-platform'] || '';
  const canonicalBase = `${req.method}\n${notesSyncRoute}\n${timestamp}\n${nonce}\n${expectedVersion}\n${bodyHash}`;
  const canonical = clientId || clientPlatform ? `${canonicalBase}\n${clientId}\n${clientPlatform}` : canonicalBase;
  const expected = crypto.createHmac('sha256', Buffer.from(notesSyncToken, 'base64url')).update(canonical).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return false;
  notesSyncUsedNonces.set(nonce, Date.now() + 120_000);
  return true;
}

async function serializeNotesSyncRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  if (!notesSyncEnabled) {
    sendJson(res, 404, { error: 'Notes Studio Pro sync is disabled. Start the server with --enable-notes-pro-sync.' });
    return true;
  }
  if (!isPrivatePeer(req.socket.remoteAddress)) {
    sendJson(res, 403, { error: 'Notes Studio Pro sync accepts private-network devices only.' });
    return true;
  }
  if (req.method === 'GET') {
    const client = getNotesSyncClient(req);
    if (client === false) {
      sendJson(res, 400, { error: 'Invalid Notes Studio Pro client identity.' });
      return true;
    }
    if (!verifyNotesSyncRequest(req)) {
      sendJson(res, 401, { error: 'Pairing signature is missing, expired, or invalid.' });
      return true;
    }
    const operation = notesSyncWriteQueue.then(async () => {
      const store = recordNotesSyncClient(await readNotesSyncStore(), client);
      if (client) await writeNotesSyncStore(store);
      res.setHeader('ETag', `"${store.version}"`);
      sendJson(res, 200, store);
    });
    notesSyncWriteQueue = operation.catch(() => {});
    operation.catch(() => sendJson(res, 500, { error: 'Could not read encrypted sync data.' }));
    return true;
  }
  if (req.method !== 'PUT') {
    sendJson(res, 405, { error: 'Use GET or PUT for Notes Studio Pro sync.' });
    return true;
  }
  readJsonBody(req).then(({ payload, raw }) => {
    const client = getNotesSyncClient(req);
    if (client === false) {
      sendJson(res, 400, { error: 'Invalid Notes Studio Pro client identity.' });
      return;
    }
    if (!verifyNotesSyncRequest(req, raw)) {
      sendJson(res, 401, { error: 'Pairing signature is missing, expired, or invalid.' });
      return;
    }
    const expectedVersion = Number(String(req.headers['if-match'] || '').replace(/^"|"$/g, ''));
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || !isValidEncryptedEnvelope(payload.envelope)) {
      sendJson(res, 400, { error: 'Expected a valid encrypted snapshot and If-Match version.' });
      return;
    }
    const operation = notesSyncWriteQueue.then(async () => {
      const current = await readNotesSyncStore();
      if (current.version !== expectedVersion) {
        res.setHeader('ETag', `"${current.version}"`);
        sendJson(res, 409, { error: 'The laptop copy changed. Sync again to merge the newer snapshot.', current });
        return;
      }
      const version = current.version + 1;
      const snapshots = [...current.snapshots, { version, updatedAt: new Date().toISOString(), envelope: payload.envelope }].slice(-12);
      const next = recordNotesSyncClient({ ...current, version, snapshots }, client);
      await writeNotesSyncStore(next);
      sendJson(res, 200, { version, updatedAt: snapshots[snapshots.length - 1].updatedAt });
    });
    notesSyncWriteQueue = operation.catch(() => {});
    operation.catch(() => sendJson(res, 500, { error: 'Could not save encrypted sync data.' }));
  }).catch(error => sendJson(res, error.statusCode || 400, { error: error.message || 'Could not read sync request.' }));
  return true;
}

if (notesSyncEnabled) {
  await fs.promises.mkdir(notesSyncDir, { recursive: true });
  try {
    notesSyncToken = (await fs.promises.readFile(notesSyncTokenPath, 'utf8')).trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    notesSyncToken = crypto.randomBytes(32).toString('base64url');
    await fs.promises.writeFile(notesSyncTokenPath, `${notesSyncToken}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  }
  if (notesSyncToken.length < 32) throw new Error(`Invalid Notes Studio Pro pairing token: ${notesSyncTokenPath}`);
}

// Read command line port or default to 8080
const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 && process.argv[portArgIndex + 1] 
  ? parseInt(process.argv[portArgIndex + 1], 10) 
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);
const hostArgIndex = process.argv.indexOf('--host');
const HOST = hostArgIndex !== -1 && process.argv[hostArgIndex + 1] ? process.argv[hostArgIndex + 1] : '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.map': 'application/json'
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, ip: iface.address });
      }
    }
  }
  return addresses;
}

if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('\x1b[31mError: dist/index.html not found! Please run `npm run build` before starting the production server.\x1b[0m');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-Match, X-Notes-Timestamp, X-Notes-Nonce, X-Notes-Signature, X-Notes-Client-ID, X-Notes-Client-Platform');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (parsedUrl.pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      mode: 'production',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      appName: 'Om Knowledge OS'
    });
    return;
  }

  if (parsedUrl.pathname === notesSyncRoute) {
    serializeNotesSyncRequest(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Parse path and sanitize to prevent directory traversal
  let safePath = path.normalize(decodeURIComponent(parsedUrl.pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(distDir, safePath);

  // If path doesn't exist, check if it's an SPA navigation route -> fallback to index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
    safePath = '/index.html';
  }

  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Caching strategies
    if (safePath.startsWith('/assets/')) {
      // Fingerprinted assets: immutable 1 year cache
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (safePath === '/sw.js' || safePath === '/manifest.json') {
      // PWA manifests & Service Workers must never be stale
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // index.html and other files: validate cache
      res.setHeader('Cache-Control', 'no-cache');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);

    if (req.method === 'HEAD') {
      res.writeHead(200);
      res.end();
      return;
    }

    const readStream = fs.createReadStream(filePath);
    res.writeHead(200);
    readStream.pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  const ips = getLocalIpAddresses();
  const wifi = ips.find(i => i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wlan')) || ips[0];

  console.log('\n\x1b[36m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ॐ OM KNOWLEDGE OS — PRODUCTION STATIC SERVER ACTIVE\x1b[0m');
  console.log('\x1b[36m========================================================================\x1b[0m\n');
  console.log(`  \x1b[1m\x1b[32m✔ Local Desktop Access:\x1b[0m         \x1b[4mhttp://localhost:${PORT}/\x1b[0m`);
  if (wifi && HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.log(`  \x1b[1m\x1b[33m✔ Samsung Galaxy S25 Ultra:\x1b[0m     \x1b[1m\x1b[4mhttp://${wifi.ip}:${PORT}/\x1b[0m`);
  }
  if (notesSyncEnabled) {
    console.log(`  ✔ Notes Studio Pro direct sync:   http://<this-laptop-ip>:${PORT}${notesSyncRoute}`);
    console.log('  ! Copy the pairing token from this user-only file into Pro on each paired device:');
    console.log(`    ${notesSyncTokenPath}`);
    console.log('  ! Pro encrypts note content and signs requests; the token itself is not sent. Keep it private.');
  }
  console.log(`  \x1b[1m\x1b[35m✔ PWA Standalone Ready:\x1b[0m         Service Worker v2.2 + Standalone Manifest`);
  console.log(`  \x1b[1m\x1b[34m✔ Serving Directory:\x1b[0m            ${distDir}\n`);
  console.log('\x1b[90m  Press Ctrl+C to stop the server\x1b[0m\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31mPort ${PORT} is already in use! Try running with --port <another-port>\x1b[0m`);
  } else {
    console.error('\x1b[31mServer error:\x1b[0m', err);
  }
  process.exit(1);
});
