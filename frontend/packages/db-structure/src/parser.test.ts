import { describe, expect, it } from 'vitest'
import {
  detectFormat,
  ProcessError,
  parse,
  setPrismWasmUrl,
  supportedFormatSchema,
} from './parser/index.js'

describe('parser exports', () => {
  it('should export detectFormat function', () => {
    expect(typeof detectFormat).toBe('function')
  })

  it('should export ProcessError class', () => {
    expect(ProcessError).toBeDefined()
    expect(typeof ProcessError).toBe('function')
  })

  it('should export parse function', () => {
    expect(typeof parse).toBe('function')
  })

  it('should export SupportedFormat enum', () => {
    expect(supportedFormatSchema).toBeDefined()
  })

  it('should export setPrismWasmUrl function for configuring prism wasm', () => {
    expect(typeof setPrismWasmUrl).toBe('function')
  })

  it('should export supportedFormatSchema for validation', () => {
    expect(supportedFormatSchema).toBeDefined()
  })

  it('should re-export all necessary parser types', () => {
    expect(parse).toBeDefined()
    expect(detectFormat).toBeDefined()
    expect(ProcessError).toBeDefined()
  })

  it('should maintain consistent export structure', () => {
    const exports = {
      detectFormat,
      parse,
      ProcessError,
      setPrismWasmUrl,
      supportedFormatSchema,
    }
    expect(Object.keys(exports)).toHaveLength(5)
  })
})
