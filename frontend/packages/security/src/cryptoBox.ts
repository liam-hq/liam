import crypto from 'node:crypto'
import type { Result } from '@liam-hq/neverthrow'
import { fromThrowable } from '@liam-hq/neverthrow'

export type Key = { id: string; key: Buffer }

/**
 * Parses KEYRING env into an in-memory keyring.
 * Format: "kid1:base64key,kid0:base64key" (first entry is current key)
 */
function parseKeyring(envValue: string | undefined): Key[] {
  const keys: Key[] = []
  const parts = (envValue ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const entry of parts) {
    const [id, b64] = entry.split(':')
    if (!id || !b64) continue
    const keyBuf = Buffer.from(b64, 'base64')
    if (keyBuf.length !== 32) continue
    keys.push({ id, key: keyBuf })
  }
  return keys
}

let RING: Key[] = parseKeyring(process.env['KEYRING'])

export function setKeyring(keys: Key[]): void {
  RING = keys
}

export function currentKey(): Result<Key, Error> {
  return fromThrowable(() => {
    if (!RING.length) {
      // eslint-disable-next-line no-throw-error/no-throw-error -- Throw to feed fromThrowable
      throw new Error('No keys configured')
    }
    const k = RING[0]
    if (!k) {
      // eslint-disable-next-line no-throw-error/no-throw-error -- Throw to feed fromThrowable
      throw new Error('No keys configured')
    }
    return k
  })()
}

export type CipherBundle = {
  keyId: string
  ciphertext: Buffer
  initializationVector: Buffer // 12 bytes
  authenticationTag: Buffer // 16 bytes
}

/**
 * Encrypts plaintext using AES-256-GCM with a random IV.
 */
export function encryptAesGcm(plaintext: string): Result<CipherBundle, Error> {
  return fromThrowable(() => {
    const keyRes = currentKey()
    if (keyRes.isErr()) throw keyRes.error
    const { id, key } = keyRes.value

    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])
    const authenticationTag = cipher.getAuthTag()
    return {
      keyId: id,
      ciphertext,
      initializationVector: iv,
      authenticationTag,
    }
  })()
}

/**
 * Decrypts ciphertext using the key identified by keyId.
 */
export function decryptAesGcm(
  keyId: string,
  ciphertext: Buffer,
  initializationVector: Buffer,
  authenticationTag: Buffer,
): Result<string, Error> {
  return fromThrowable(() => {
    const entry = RING.find((k) => k.id === keyId)
    if (!entry)
      // eslint-disable-next-line no-throw-error/no-throw-error -- Throw to feed fromThrowable
      throw new Error('Unknown key id')

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      entry.key,
      initializationVector,
    )
    decipher.setAuthTag(authenticationTag)
    const pt = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return pt.toString('utf8')
  })()
}
