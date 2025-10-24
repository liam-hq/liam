// Server-only utility for encrypted GitHub tokens stored in HttpOnly cookies

import {
  fromPromise,
  fromThrowable,
  type ResultAsync,
} from '@liam-hq/neverthrow'
import { decryptAesGcm, encryptAesGcm } from '@liam-hq/security/cryptoBox'
import { errAsync, okAsync } from 'neverthrow'
import { cookies } from 'next/headers'
import * as v from 'valibot'

const ACCESS_COOKIE = 'liam_at'
const REFRESH_COOKIE = 'liam_rt'

// Plain payload stored (before encryption)
const TokenPayloadSchema = v.object({
  token: v.string(),
  expiresAt: v.string(), // ISO8601
})
export type TokenPayload = v.InferOutput<typeof TokenPayloadSchema>

// Encrypted bundle packed for cookie value
const PackedSchema = v.object({
  key_id: v.string(),
  ciphertext: v.string(), // base64
  initialization_vector: v.string(), // base64
  authentication_tag: v.string(), // base64
})
type Packed = v.InferOutput<typeof PackedSchema>

function isProd(): boolean {
  return process.env.NODE_ENV === 'production'
}

function toMaxAgeSeconds(expiresAtIso: string): number {
  const now = Date.now()
  const t = new Date(expiresAtIso).getTime()
  if (Number.isNaN(t)) return 0
  const diffMs = Math.max(0, t - now)
  return Math.floor(diffMs / 1000)
}

function packCookieValue(plaintext: string) {
  const toJson = fromThrowable(JSON.stringify)
  return encryptAesGcm(plaintext).andThen(
    ({ keyId, ciphertext, initializationVector, authenticationTag }) => {
      const packed: Packed = {
        key_id: keyId,
        ciphertext: ciphertext.toString('base64'),
        initialization_vector: initializationVector.toString('base64'),
        authentication_tag: authenticationTag.toString('base64'),
      }
      return toJson(packed)
    },
  )
}

function unpackCookieValue(value: string) {
  const parseJson = fromThrowable(JSON.parse)
  const toPacked = fromThrowable((json: unknown): Packed => {
    const parsed = v.safeParse(PackedSchema, json)
    if (!parsed.success)
      // eslint-disable-next-line no-throw-error/no-throw-error -- Throw to feed fromThrowable wrapper
      throw new Error('Invalid packed cookie schema')
    return parsed.output
  })
  return parseJson(value)
    .andThen(toPacked)
    .andThen((p) =>
      decryptAesGcm(
        p.key_id,
        Buffer.from(p.ciphertext, 'base64'),
        Buffer.from(p.initialization_vector, 'base64'),
        Buffer.from(p.authentication_tag, 'base64'),
      ),
    )
}

async function readTokenFrom(name: string): Promise<TokenPayload | null> {
  const store = await cookies()
  const raw = store.get(name)?.value
  if (!raw) {
    return null
  }
  const plaintext = unpackCookieValue(raw)
  if (plaintext.isErr()) {
    return null
  }
  const parsePayload = fromThrowable(JSON.parse)
  const payloadJson = parsePayload(plaintext.value)
  if (payloadJson.isErr()) {
    return null
  }
  const parsed = v.safeParse(TokenPayloadSchema, payloadJson.value)
  if (!parsed.success) {
    return null
  }
  return parsed.output
}

async function writeTokenTo(
  name: string,
  token: string,
  expiresAt: string,
): Promise<void> {
  const payload: TokenPayload = { token, expiresAt }
  const toJson = fromThrowable(JSON.stringify)
  const plaintext = toJson(payload)
  if (plaintext.isErr()) {
    throw plaintext.error
  }
  const value = packCookieValue(plaintext.value)
  if (value.isErr()) {
    throw value.error
  }
  const maxAge = toMaxAgeSeconds(expiresAt)
  const store = await cookies()
  store.set(name, value.value, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge,
    // Set expires for broader compatibility
    expires: new Date(Date.now() + maxAge * 1000),
  })
}

async function deleteCookie(name: string): Promise<void> {
  const store = await cookies()
  // Explicitly expire the cookie; some clients respect attributes
  store.set(name, '', {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

export async function readAccessToken(): Promise<TokenPayload | null> {
  return readTokenFrom(ACCESS_COOKIE)
}

export function readRefreshToken(): ResultAsync<TokenPayload, Error> {
  return fromPromise(readTokenFrom(REFRESH_COOKIE)).andThen((token) => {
    if (token === null) {
      return errAsync(new Error('Refresh token not found'))
    }
    return okAsync(token)
  })
}

export async function writeAccessToken(
  token: string,
  expiresAt: string,
): Promise<void> {
  await writeTokenTo(ACCESS_COOKIE, token, expiresAt)
}

export async function writeRefreshToken(
  token: string,
  expiresAt: string,
): Promise<void> {
  await writeTokenTo(REFRESH_COOKIE, token, expiresAt)
}

export async function clearTokens(): Promise<void> {
  await deleteCookie(ACCESS_COOKIE)
  await deleteCookie(REFRESH_COOKIE)
}
