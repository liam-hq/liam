import { describe, expect, it } from 'vitest'
import { compressToEncodedUriComponent } from './compressToEncodedUriComponent'
import { decompressFromEncodedUriComponent } from './decompressFromEncodedUriComponent'

describe('compressionString', () => {
  it('should compress and decompress a string correctly', async () => {
    const input = 'Hello, world!'
    const compressed = compressToEncodedUriComponent(input)
    const decompressed = decompressFromEncodedUriComponent(compressed)

    expect(compressed).toMatchInlineSnapshot(`"eJzzSM3JyddRKM8vyklRBAAgXgSK"`)
    expect(decompressed).toBe(input)
  })

  it('should handle empty string', async () => {
    const input = ''
    const compressed = compressToEncodedUriComponent(input)
    const decompressed = decompressFromEncodedUriComponent(compressed)

    expect(compressed).toMatchInlineSnapshot(`"eJwDAAAAAAE"`)
    expect(decompressed).toBe(input)
  })

  it('should handle long string', async () => {
    const input = 'a'.repeat(1000)
    const compressed = compressToEncodedUriComponent(input)
    const decompressed = decompressFromEncodedUriComponent(compressed)

    expect(compressed).toMatchInlineSnapshot(`"eJxLTBwFo2AUDHcAAPnYevg"`)
    expect(decompressed).toBe(input)
  })

  it('should handle special characters', async () => {
    // eslint-disable-next-line no-non-english/no-non-english-characters
    const input = 'こんにちは、世界！'
    const compressed = compressToEncodedUriComponent(input)
    const decompressed = decompressFromEncodedUriComponent(compressed)

    expect(compressed).toMatchInlineSnapshot(
      `"eJwBGwDk_-OBk-OCk-OBq-OBoeOBr-OAgeS4lueVjO-8gQC2EmE"`,
    )
    expect(decompressed).toBe(input)
  })

  it('should handle binary data', async () => {
    const input = String.fromCharCode(
      ...Array.from({ length: 256 }, (_, i) => i),
    )
    const compressed = compressToEncodedUriComponent(input)
    const decompressed = decompressFromEncodedUriComponent(compressed)

    expect(compressed).toMatchInlineSnapshot(
      `"eJwFwQNXHQAABtBse9mu1bKWbbuWFpbN9arXy7Zt23XO9_2x7hUTl5CUkpaRlZNXUFRSVlFVU9fQ1NLW0dX7oW9gaGRsYmpmbmFpZW1ja2fv4Ojk_NPF9Zebu4enl7ePr59_wO_AoOCQ0LDwiMio6JjYuPiExKTklNS09IzMrOyc3Lz8gsI_RcUlpWV_yysqq_5V19TW1Tc0NjW3tLa1d3R2dff874UAfejHAIQYhAhDGMYIRjGGcUxgElOYxgxmMYd5LGARS1jGClaxhnVsYBNb2MYOdrGHfRzgEEc4xglOcYZzXOASV7jGDW5xh3s84BFPeMYLXvGGd3zgE18UsI_9HKCQgxRxiMMc4SjHOM4JTnKK05zhLOc4zwUuconLXOEq17jODW5yi9vc4S73uM8DHvKIxzzhKc94zgte8orXvOEt73jPBz7yic984Svf-M4PfvLrG5oE0ME"`,
    )
    expect(decompressed).toBe(input)
  })
})
