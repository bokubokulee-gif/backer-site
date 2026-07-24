'use strict';

const {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual
} = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);

function hmacValue(secret, keyVersion, namespace, value) {
  if (!secret || !keyVersion || !namespace) throw new Error('HMAC configuration is incomplete');
  return createHmac('sha256', secret)
    .update(String(keyVersion))
    .update('\0')
    .update(String(namespace))
    .update('\0')
    .update(String(value))
    .digest('base64url');
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length !== b.length) {
    const padded = Buffer.alloc(Math.max(a.length, b.length, 1));
    const other = Buffer.alloc(padded.length);
    a.copy(padded);
    b.copy(other);
    timingSafeEqual(padded, other);
    return false;
  }
  return timingSafeEqual(a, b);
}

function parseEncryptionKey(value) {
  const key = Buffer.from(String(value || ''), 'base64');
  if (key.length !== 32) throw new Error('IP encryption key must decode to exactly 32 bytes');
  return key;
}

function encryptIp(ip, keyB64, keyVersion, randomSource) {
  const key = parseEncryptionKey(keyB64);
  const iv = (randomSource || randomBytes)(12);
  if (!Buffer.isBuffer(iv) || iv.length !== 12) throw new Error('AES-GCM IV must be 12 bytes');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(`backer-ip:${keyVersion}`, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(String(ip), 'utf8'), cipher.final()]);
  return {
    ciphertext,
    iv,
    tag: cipher.getAuthTag(),
    keyVersion
  };
}

function decryptIp(record, keyB64) {
  const key = parseEncryptionKey(keyB64);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(record.iv));
  decipher.setAAD(Buffer.from(`backer-ip:${record.keyVersion}`, 'utf8'));
  decipher.setAuthTag(Buffer.from(record.tag));
  return Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext)),
    decipher.final()
  ]).toString('utf8');
}

function parseScryptHash(encoded) {
  const parts = String(encoded || '').split('$');
  if (parts.length !== 7 || parts[0] !== 'scrypt') return null;
  const [, nText, rText, pText, keyLengthText, saltText, digestText] = parts;
  const n = Number(nText);
  const r = Number(rText);
  const p = Number(pText);
  const keyLength = Number(keyLengthText);
  const salt = Buffer.from(saltText, 'base64url');
  const digest = Buffer.from(digestText, 'base64url');
  if (
    !Number.isInteger(n) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    !Number.isInteger(keyLength) ||
    n < 16_384 ||
    r < 1 ||
    p < 1 ||
    keyLength < 32 ||
    salt.length < 16 ||
    digest.length !== keyLength
  ) {
    return null;
  }
  return { n, r, p, keyLength, salt, digest };
}

async function verifyScryptPassword(password, encoded) {
  const parsed = parseScryptHash(encoded);
  if (!parsed) {
    await scryptAsync(String(password || ''), Buffer.alloc(16), 32, {
      N: 16_384,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024
    });
    return false;
  }
  const actual = await scryptAsync(String(password || ''), parsed.salt, parsed.keyLength, {
    N: parsed.n,
    r: parsed.r,
    p: parsed.p,
    maxmem: Math.max(64 * 1024 * 1024, 128 * parsed.n * parsed.r * 2)
  });
  return timingSafeEqual(Buffer.from(actual), parsed.digest);
}

async function createScryptPasswordHash(password, options) {
  const config = Object.assign(
    { n: 32_768, r: 8, p: 1, keyLength: 32, salt: randomBytes(16) },
    options || {}
  );
  const digest = await scryptAsync(String(password), config.salt, config.keyLength, {
    N: config.n,
    r: config.r,
    p: config.p,
    maxmem: Math.max(64 * 1024 * 1024, 128 * config.n * config.r * 2)
  });
  return [
    'scrypt',
    config.n,
    config.r,
    config.p,
    config.keyLength,
    Buffer.from(config.salt).toString('base64url'),
    Buffer.from(digest).toString('base64url')
  ].join('$');
}

module.exports = {
  createScryptPasswordHash,
  decryptIp,
  encryptIp,
  hmacValue,
  parseEncryptionKey,
  parseScryptHash,
  safeEqualText,
  verifyScryptPassword
};
