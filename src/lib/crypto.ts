/**
 * AES-256-GCM Encryption/Decryption for API keys
 *
 * Uses Node.js crypto module with:
 * - AES-256-GCM (authenticated encryption)
 * - Random IV per encryption (stored with ciphertext)
 * - ENCRYPTION_SECRET env var as master key (hashed to 32 bytes via SHA-256)
 *
 * Storage format: base64(iv:authTag:ciphertext)
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the master secret using SHA-256
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      'ENCRYPTION_SECRET environment variable is not set. ' +
        'Generate one with: openssl rand -hex 32'
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @returns base64-encoded string containing iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + ciphertext and base64 encode
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
}

/**
 * Decrypts a base64-encoded AES-256-GCM ciphertext
 * @returns the original plaintext
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Extract iv, authTag, ciphertext
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masks an API key for display purposes
 * Shows first 4 and last 4 characters, masks middle with bullets
 * e.g., "sk-proj-abc...xyz" → "sk-p••••••••••xyz"
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '••••••••';
  const prefix = key.substring(0, 4);
  const suffix = key.substring(key.length - 4);
  return `${prefix}${'••••••••'}${suffix}`;
}

/**
 * Validates that a string looks like a real API key (not empty/placeholder)
 */
export function isValidApiKey(key: string): boolean {
  if (!key || key.trim().length === 0) return false;
  if (key.includes('placeholder') || key.includes('••••')) return false;
  return key.length >= 10;
}
