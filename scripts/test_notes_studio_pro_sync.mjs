import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const route = '/api/notes-studio-pro/sync';
const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'om-notes-pro-sync-test-'));
const serverDataRoot = path.join(testRoot, 'server-data');
const serverStore = path.join(serverDataRoot, 'OmKnowledgeOS', 'NotesStudioProSync', 'vault-encrypted.json');
let child;

async function choosePort() {
  const probe = http.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const { port } = probe.address();
  await new Promise(resolve => probe.close(resolve));
  return port;
}

async function requestSignature(method, token, bodyText = '', ifMatch = '', clientId = 'test-s25', clientPlatform = 'android', nonce = crypto.randomBytes(18).toString('base64url')) {
  const timestamp = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(bodyText).digest('base64url');
  const canonical = `${method}\n${route}\n${timestamp}\n${nonce}\n${ifMatch}\n${bodyHash}\n${clientId}\n${clientPlatform}`;
  const signature = crypto.createHmac('sha256', Buffer.from(token, 'base64url')).update(canonical).digest('base64url');
  return { 'X-Notes-Timestamp': timestamp, 'X-Notes-Nonce': nonce, 'X-Notes-Signature': signature, 'X-Notes-Client-ID': clientId, 'X-Notes-Client-Platform': clientPlatform, ...(ifMatch ? { 'If-Match': ifMatch } : {}) };
}

async function request(url, method = 'GET', token, bodyText = '', ifMatch = '', clientId = 'test-s25', clientPlatform = 'android') {
  const headers = await requestSignature(method, token, bodyText, ifMatch, clientId, clientPlatform);
  if (bodyText) headers['Content-Type'] = 'application/json';
  return fetch(url, { method, headers, ...(bodyText ? { body: bodyText } : {}) });
}

const assertStatus = async (response, expected, label) => {
  assert.equal(response.status, expected, `${label}: expected HTTP ${expected}, got ${response.status}`);
};

try {
  const port = await choosePort();
  child = spawn(process.execPath, [
    path.join(rootDir, 'scripts', 'serve_production.mjs'),
    '--enable-notes-pro-sync', '--host', '127.0.0.1', '--port', String(port)
  ], {
    cwd: rootDir,
    env: { ...process.env, LOCALAPPDATA: serverDataRoot, XDG_DATA_HOME: serverDataRoot },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let startupOutput = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { startupOutput += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { startupOutput += chunk; });

  const url = `http://127.0.0.1:${port}${route}`;
  let readyResponse;
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Sync test server exited during startup. ${startupOutput}`);
    try {
      readyResponse = await fetch(url, { signal: AbortSignal.timeout(500) });
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }
  assert.ok(readyResponse, `Sync test server did not start. ${startupOutput}`);
  await assertStatus(readyResponse, 401, 'Unauthenticated GET is rejected');

  const tokenPath = path.join(serverDataRoot, 'OmKnowledgeOS', 'NotesStudioProSync', 'pairing-token.txt');
  const token = (await fs.readFile(tokenPath, 'utf8')).trim();
  assert.equal(Buffer.from(token, 'base64url').length, 32, 'Server creates a 32-byte pairing token');

  const preflight = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://localhost',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'content-type,if-match,x-notes-timestamp,x-notes-nonce,x-notes-signature,x-notes-client-id,x-notes-client-platform'
    }
  });
  await assertStatus(preflight, 204, 'WebView CORS preflight succeeds');
  assert.match(preflight.headers.get('access-control-allow-headers') || '', /X-Notes-Signature/i);

  const initialRead = await request(url, 'GET', token);
  await assertStatus(initialRead, 200, 'Signed initial GET succeeds');
  const initialStore = await initialRead.json();
  assert.equal(initialStore.version, 0);
  assert.deepEqual(initialStore.snapshots, []);
  assert.equal(initialStore.clients['test-s25'].platform, 'android', 'Signed Android heartbeat is reported to the paired desktop');
  assert.ok(initialStore.clients['test-s25'].lastSeenAt, 'Phone status includes its last signed check-in time');

  const envelope = {
    format: 'om-notes-pro-e2e-v1',
    salt: crypto.randomBytes(16).toString('base64url'),
    iv: crypto.randomBytes(12).toString('base64url'),
    ciphertext: crypto.randomBytes(48).toString('base64url')
  };
  const bodyText = JSON.stringify({ envelope });
  const writeHeaders = await requestSignature('PUT', token, bodyText, '"0"');
  const write = await fetch(url, { method: 'PUT', headers: { ...writeHeaders, 'Content-Type': 'application/json' }, body: bodyText });
  await assertStatus(write, 200, 'Signed encrypted snapshot write succeeds');
  assert.equal((await write.json()).version, 1);

  const replay = await fetch(url, { method: 'PUT', headers: { ...writeHeaders, 'Content-Type': 'application/json' }, body: bodyText });
  await assertStatus(replay, 401, 'Replayed write nonce is rejected');

  const wrongTokenWrite = await request(url, 'GET', crypto.randomBytes(32).toString('base64url'));
  await assertStatus(wrongTokenWrite, 401, 'Invalid pairing signature is rejected');

  const staleBody = JSON.stringify({ envelope: { ...envelope, iv: crypto.randomBytes(12).toString('base64url') } });
  const staleWrite = await request(url, 'PUT', token, staleBody, '"0"');
  await assertStatus(staleWrite, 409, 'Stale version is rejected without overwriting');
  assert.equal((await staleWrite.json()).current.version, 1);

  const latestRead = await request(url, 'GET', token);
  await assertStatus(latestRead, 200, 'Signed latest GET succeeds');
  const latestStore = await latestRead.json();
  assert.equal(latestStore.version, 1);
  assert.deepEqual(latestStore.snapshots[0].envelope, envelope);

  const storedText = await fs.readFile(serverStore, 'utf8');
  assert.ok(!storedText.includes('NOTE_PRIVATE_SENTINEL'), 'Test plaintext sentinel is absent from stored snapshot');
  assert.deepEqual(JSON.parse(storedText), latestStore, 'On-disk server data matches the encrypted envelope only');

  const desktopRead = await request(url, 'GET', token, '', '', 'test-laptop', 'desktop');
  await assertStatus(desktopRead, 200, 'Signed desktop heartbeat succeeds');
  const clients = (await desktopRead.json()).clients;
  assert.equal(clients['test-laptop'].platform, 'desktop', 'Desktop heartbeat is separately identified');
  assert.equal(clients['test-s25'].platform, 'android', 'Phone heartbeat remains available after desktop check-in');

  for (let version = 1; version < 12; version += 1) {
    const nextEnvelope = { ...envelope, iv: crypto.randomBytes(12).toString('base64url'), ciphertext: crypto.randomBytes(48).toString('base64url') };
    const nextBody = JSON.stringify({ envelope: nextEnvelope });
    const nextWrite = await request(url, 'PUT', token, nextBody, `"${version}"`);
    await assertStatus(nextWrite, 200, `Version ${version + 1} write succeeds`);
  }
  const retained = JSON.parse(await fs.readFile(serverStore, 'utf8'));
  assert.equal(retained.version, 12);
  assert.equal(retained.snapshots.length, 12, 'Only the newest twelve encrypted snapshots are retained');

  console.log('Notes Studio Pro sync integration checks passed: pairing auth, CORS, encrypted envelope persistence, replay rejection, stale-version protection, and 12-snapshot retention.');
} finally {
  if (child && child.exitCode === null) {
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 2500);
      child.once('exit', () => { clearTimeout(timeout); resolve(); });
      child.kill();
    });
  }
  const resolvedRoot = path.resolve(testRoot);
  if (!resolvedRoot.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolvedRoot).startsWith('om-notes-pro-sync-test-')) {
    throw new Error(`Refusing to remove unexpected test directory: ${resolvedRoot}`);
  }
  await fs.rm(resolvedRoot, { recursive: true, force: true });
}
