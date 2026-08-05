import crypto from 'crypto';
import env from '../config/env.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt a plain text value.
 * Returns a hex string: IV (32 chars) + encrypted data.
 * Returns null if input is null/undefined.
 */
export function encrypt(text) {
  if (text === null || text === undefined) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(env.encryptionKey, 'hex'), iv);

  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted value produced by encrypt().
 * Returns the original plain text, or null if input is null/undefined.
 */
export function decrypt(encryptedText) {
  if (encryptedText === null || encryptedText === undefined) return null;
  // Not an encrypted payload (e.g. legacy plaintext stored before individualHooks were
  // used on bulkCreate) — pass it through unchanged instead of throwing.
  if (typeof encryptedText !== 'string' || !encryptedText.includes(':')) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(env.encryptionKey, 'hex'), iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // Malformed/corrupt value — return unchanged rather than crashing the request.
    return encryptedText;
  }
}

/**
 * Encrypt all amount fields in an object (mutates and returns it).
 * Fields ending with '_amount' or named 'exchange_rate' will be encrypted.
 */
export function encryptAmounts(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    if ((key.endsWith('_amount') || key === 'exchange_rate') && obj[key] !== null && obj[key] !== undefined) {
      obj[key] = encrypt(String(obj[key]));
    }
  }
  return obj;
}

/**
 * Decrypt all amount fields in an object (mutates and returns it).
 */
export function decryptAmounts(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    if ((key.endsWith('_amount') || key === 'exchange_rate') && obj[key] !== null && obj[key] !== undefined) {
      const decrypted = decrypt(obj[key]);
      obj[key] = decrypted !== null ? parseFloat(decrypted) : null;
    }
  }
  return obj;
}
