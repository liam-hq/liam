import { describe, expect, it } from 'vitest'
import {
  base64ToUint8Array,
  byteaToUint8Array,
  hexToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToString,
} from './byteaUtils'

describe('byteaUtils', () => {
  describe('uint8ArrayToBase64', () => {
    it('should convert Uint8Array to base64 string', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = uint8ArrayToBase64(input)
      expect(result).toBe('SGVsbG8=') // Base64 for "Hello"
    })

    it('should handle empty Uint8Array', () => {
      const input = new Uint8Array([])
      const result = uint8ArrayToBase64(input)
      expect(result).toBe('')
    })

    it('should handle large binary data', () => {
      const input = new Uint8Array(1000).fill(255)
      const result = uint8ArrayToBase64(input)
      expect(result).toBeTruthy()
      // Verify it can be decoded back
      const decoded = base64ToUint8Array(result)
      expect(decoded).toEqual(input)
    })
  })

  describe('hexToUint8Array', () => {
    it('should convert hex string with \\x prefix to Uint8Array', () => {
      const input = '\\x48656c6c6f' // "Hello" in hex
      const result = hexToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })

    it('should convert hex string without \\x prefix to Uint8Array', () => {
      const input = '48656c6c6f' // "Hello" in hex without prefix
      const result = hexToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })

    it('should handle empty hex string', () => {
      const input = '\\x'
      const result = hexToUint8Array(input)
      expect(result).toEqual(new Uint8Array([]))
    })

    it('should handle hex with mixed case', () => {
      const input = '\\x48656C6C6F' // Mixed case hex
      const result = hexToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })
  })

  describe('base64ToUint8Array', () => {
    it('should convert base64 string to Uint8Array', () => {
      const input = 'SGVsbG8=' // Base64 for "Hello"
      const result = base64ToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })

    it('should handle empty base64 string', () => {
      const input = ''
      const result = base64ToUint8Array(input)
      expect(result).toEqual(new Uint8Array([]))
    })

    it('should handle base64 with padding', () => {
      const input = 'SGVsbG8h' // Base64 for "Hello!"
      const result = base64ToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111, 33]))
    })
  })

  describe('byteaToUint8Array', () => {
    it('should convert hex format from Supabase', () => {
      const input = '\\x48656c6c6f' // Hex format from Supabase
      const result = byteaToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })

    it('should handle hex format with complex binary data', () => {
      // Binary data including null bytes and special characters
      const input = '\\x0001ff7f80'
      const result = byteaToUint8Array(input)
      expect(result).toEqual(new Uint8Array([0, 1, 255, 127, 128]))
    })

    it('should handle hex format without prefix', () => {
      // Some edge cases might not have the \x prefix
      const input = '48656c6c6f'
      const result = byteaToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })
  })

  describe('uint8ArrayToString', () => {
    it('should convert Uint8Array to UTF-8 string', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = uint8ArrayToString(input)
      expect(result).toBe('Hello')
    })

    it('should handle UTF-8 multi-byte characters', () => {
      // "Hello World" with emoji in UTF-8
      const input = new Uint8Array([
        72,
        101,
        108,
        108,
        111,
        32, // "Hello "
        240,
        159,
        140,
        141, // emoji bytes
      ])
      const result = uint8ArrayToString(input)
      expect(result).toBe('Hello 🌍')
    })

    it('should handle empty Uint8Array', () => {
      const input = new Uint8Array([])
      const result = uint8ArrayToString(input)
      expect(result).toBe('')
    })
  })

  describe('round-trip conversions', () => {
    it('should preserve data through base64 round-trip', () => {
      const original = new Uint8Array([0, 1, 2, 127, 128, 255])
      const base64 = uint8ArrayToBase64(original)
      const restored = base64ToUint8Array(base64)
      expect(restored).toEqual(original)
    })

    it('should preserve data through hex round-trip', () => {
      const original = new Uint8Array([0, 1, 2, 127, 128, 255])
      // Simulate what Supabase returns
      const hex = `\\x${Array.from(original)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`
      const restored = hexToUint8Array(hex)
      expect(restored).toEqual(original)
    })

    it('should handle byteaToUint8Array with hex format correctly', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111])

      // Test with hex format (Supabase returns this)
      const hex = '\\x48656c6c6f'
      const fromHex = byteaToUint8Array(hex)
      expect(fromHex).toEqual(original)
    })
  })
})
