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
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Read command line port or default to 8080
const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 && process.argv[portArgIndex + 1] 
  ? parseInt(process.argv[portArgIndex + 1], 10) 
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Parse path and sanitize to prevent directory traversal
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
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

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  const wifi = ips.find(i => i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wlan')) || ips[0];

  console.log('\n\x1b[36m========================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  ॐ OM KNOWLEDGE OS — PRODUCTION STATIC SERVER ACTIVE\x1b[0m');
  console.log('\x1b[36m========================================================================\x1b[0m\n');
  console.log(`  \x1b[1m\x1b[32m✔ Local Desktop Access:\x1b[0m         \x1b[4mhttp://localhost:${PORT}/\x1b[0m`);
  if (wifi) {
    console.log(`  \x1b[1m\x1b[33m✔ Samsung Galaxy S25 Ultra:\x1b[0m     \x1b[1m\x1b[4mhttp://${wifi.ip}:${PORT}/\x1b[0m`);
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
