/**
 * =================================================================================
 * OM KNOWLEDGE OS: ZERO-KNOWLEDGE CLIENT-SIDE ENCRYPTION SERVICE
 * =================================================================================
 * Standard: WebCrypto API (AES-GCM-256 + PBKDF2 SHA-256)
 * Iterations: 100,000 rounds
 * Salt: 16 bytes cryptographically random
 * IV: 12 bytes unique per message
 * Format: om-enc:<base64-salt>:<base64-iv>:<base64-ciphertext>
 */

const PBKDF2_ITERATIONS = 100000;
export const VAULT_PREFIX = 'om-enc:';

// In-memory session key cache (cleared on tab close / lock)
let sessionPassphrase: string | null = null;

export function setSessionPassphrase(pass: string | null) {
  sessionPassphrase = pass;
}

export function getSessionPassphrase(): string | null {
  return sessionPassphrase;
}

export function isSessionUnlocked(): boolean {
  return !!sessionPassphrase;
}

/**
 * Derives AES-GCM 256-bit key from passphrase and salt
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: (salt as unknown as BufferSource),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext string using AES-GCM-256
 */
export async function encryptVaultText(plaintext: string, passphrase?: string): Promise<string> {
  const pass = passphrase || sessionPassphrase;
  if (!pass) {
    throw new Error('Encryption failed: No passphrase provided and vault is locked.');
  }

  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: (iv as unknown as BufferSource) },
    key,
    (enc.encode(plaintext) as unknown as BufferSource)
  );

  const toBase64 = (arr: Uint8Array) => {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  };

  const saltB64 = toBase64(salt);
  const ivB64 = toBase64(iv);
  const cipherB64 = toBase64(new Uint8Array(cipherBuffer));

  return `${VAULT_PREFIX}${saltB64}:${ivB64}:${cipherB64}`;
}

/**
 * Decrypts AES-GCM-256 ciphertext bundle
 */
export async function decryptVaultText(cipherBundle: string, passphrase?: string): Promise<string> {
  if (!isVaultEncrypted(cipherBundle)) {
    return cipherBundle; // Already plaintext
  }

  const pass = passphrase || sessionPassphrase;
  if (!pass) {
    throw new Error('Vault is locked. Enter master passphrase to decrypt.');
  }

  const raw = cipherBundle.slice(VAULT_PREFIX.length);
  const parts = raw.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted bundle format.');
  }

  const fromBase64 = (b64: string) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const salt = fromBase64(parts[0]);
  const iv = fromBase64(parts[1]);
  const ciphertext = fromBase64(parts[2]);

  const key = await deriveKey(pass, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: (iv as unknown as BufferSource) },
      key,
      (ciphertext as unknown as BufferSource)
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    throw new Error('Decryption failed: Incorrect master passphrase or corrupted record.');
  }
}

/**
 * Checks whether content is encrypted with the vault prefix
 */
export function isVaultEncrypted(text: string): boolean {
  return typeof text === 'string' && text.startsWith(VAULT_PREFIX);
}

