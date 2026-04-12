import crypto from 'crypto'

const ALG = 'aes-256-gcm'
const IV_LEN = 16
const AUTH_TAG_LEN = 16

function deriveKey(): Buffer {
  const raw = process.env.WOO_CREDENTIALS_ENCRYPTION_KEY
  if (raw && raw.length > 0) {
    if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
      return Buffer.from(raw, 'hex')
    }
    const buf = Buffer.from(raw, 'utf8')
    if (buf.length === 32) return buf
    return crypto.createHash('sha256').update(raw, 'utf8').digest()
  }
  const fallback = process.env.JWT_SECRET || 'dev-woo-credentials-fallback'
  return crypto.createHash('sha256').update(fallback, 'utf8').digest()
}

/**
 * Encrypt WooCommerce API keys at rest (AES-256-GCM).
 * Set WOO_CREDENTIALS_ENCRYPTION_KEY to 32-byte hex (64 chars) in production.
 */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALG, deriveKey(), iv, { authTagLength: AUTH_TAG_LEN })
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64url')
}

export function decryptSecret(enc: string): string {
  const buf = Buffer.from(enc, 'base64url')
  if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) {
    throw new Error('Invalid encrypted credential payload')
  }
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN)
  const data = buf.subarray(IV_LEN + AUTH_TAG_LEN)
  const decipher = crypto.createDecipheriv(ALG, deriveKey(), iv, { authTagLength: AUTH_TAG_LEN })
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('hex')
}
