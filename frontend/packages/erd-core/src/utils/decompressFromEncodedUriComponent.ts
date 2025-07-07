import * as pako from 'pako'

/**
 * Convert URL-safe string back to Base64
 */
function urlSafeToBase64(urlSafe: string): string {
  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return base64
}

/**
 * Decode Base64 string to byte array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const length = binaryString.length
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Restore original string from URL-safe encoded string (synchronous)
 */
export function decompressFromEncodedUriComponent(input: string): string {
  const base64 = urlSafeToBase64(input)
  const compressedBytes = base64ToBytes(base64)
  const decompressedBytes = pako.inflate(compressedBytes)
  const textDecoder = new TextDecoder()
  return textDecoder.decode(decompressedBytes)
}
