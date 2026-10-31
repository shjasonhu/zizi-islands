/**
 * Family textbook bundle encryption.
 * AES-GCM with a PBKDF2-SHA-256 key. Web Crypto only, so the same file
 * decrypts in the browser and in Node.
 *
 * File shape (JSON):
 * { format:"zizi-content-enc", version:1, kdf:"PBKDF2", hash:"SHA-256",
 *   iterations, salt, iv, ciphertext }
 * salt, iv, and ciphertext are standard base64.
 */

export const DEFAULT_ITERATIONS = 150_000

function bytesToB64(bytes) {
  let s = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(s)
}

function b64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKey(password, salt, iterations, usages) {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  )
}

export async function encryptJson(value, password, iterations = DEFAULT_ITERATIONS) {
  if (!password) throw new Error('Password is empty')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, iterations, ['encrypt'])
  const plain = new TextEncoder().encode(JSON.stringify(value))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain))
  return {
    format: 'zizi-content-enc',
    version: 1,
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iterations,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(ct),
  }
}

/** True only for our encrypted bundle. HTML (the SPA fallback) is not a pack. */
export function readEncPayload(text, contentType = '') {
  const type = String(contentType || '').toLowerCase()
  if (type.includes('html')) return null
  const body = String(text || '')
  if (body.trimStart().startsWith('<')) return null
  let data
  try {
    data = JSON.parse(body)
  } catch {
    return null
  }
  if (!data || data.format !== 'zizi-content-enc' || data.version !== 1 || !data.ciphertext) return null
  return data
}

export async function decryptJson(payload, password) {
  if (!payload || payload.format !== 'zizi-content-enc' || payload.version !== 1) {
    throw new Error('Not a Zizi Islands content file')
  }
  if (!password) throw new Error('Password is empty')
  const salt = b64ToBytes(payload.salt)
  const iv = b64ToBytes(payload.iv)
  const ct = b64ToBytes(payload.ciphertext)
  const key = await deriveKey(password, salt, payload.iterations, ['decrypt'])
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return JSON.parse(new TextDecoder().decode(plain))
  } catch {
    throw new Error('Wrong password or damaged file')
  }
}
