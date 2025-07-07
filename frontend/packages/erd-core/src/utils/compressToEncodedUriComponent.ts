import * as pako from 'pako'

/**
 * Encode byte array to Base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binaryString = ''
  for (const b of Array.from(bytes)) {
    binaryString += String.fromCharCode(b)
  }
  return btoa(binaryString)
}

/**
 * Convert Base64 string to URL-safe string (`+` => `-`, `/` => `_`, remove `=`)
 */
function base64ToUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Compress string using Deflate and return as URL-safe encoded string (synchronous)
 */
export function compressToEncodedUriComponent(input: string): string {
  const textEncoder = new TextEncoder()
  const inputBytes = textEncoder.encode(input)
  const compressedBytes = pako.deflate(inputBytes)
  const base64 = bytesToBase64(compressedBytes)
  return base64ToUrlSafe(base64)
}
