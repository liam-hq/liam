import { describe, expect, it } from 'vitest'
import { generateHeadingId } from '../generateHeadingId'

describe('generateHeadingId', () => {
  it('converts simple text to lowercase with hyphens', () => {
    expect(generateHeadingId('Hello World')).toMatchInlineSnapshot(
      `"hello-world"`,
    )
  })

  it('handles text with numbers', () => {
    expect(generateHeadingId('Section 123')).toMatchInlineSnapshot(
      `"section-123"`,
    )
  })

  it('preserves underscores and hyphens', () => {
    expect(generateHeadingId('hello_world-test')).toMatchInlineSnapshot(
      `"hello_world-test"`,
    )
  })

  it('removes special characters and replaces with hyphens', () => {
    expect(generateHeadingId('Hello! World? Test.')).toMatchInlineSnapshot(
      `"hello-world-test"`,
    )
  })

  it('handles consecutive special characters', () => {
    expect(generateHeadingId('Hello!!!   World')).toMatchInlineSnapshot(
      `"hello-world"`,
    )
  })

  it('trims whitespace from beginning and end', () => {
    expect(generateHeadingId('  Hello World  ')).toMatchInlineSnapshot(
      `"hello-world"`,
    )
  })

  it('removes leading and trailing hyphens', () => {
    expect(generateHeadingId('---Hello World---')).toMatchInlineSnapshot(
      `"hello-world"`,
    )
  })

  it('handles empty string', () => {
    expect(generateHeadingId('')).toMatchInlineSnapshot(`""`)
  })

  it('handles string with only special characters', () => {
    expect(generateHeadingId('!@#$%^&*()')).toMatchInlineSnapshot(`""`)
  })

  it('handles unicode letters correctly', () => {
    expect(generateHeadingId('Über Größe')).toMatchInlineSnapshot(
      `"über-größe"`,
    )
  })

  it('handles mixed unicode and ASCII characters', () => {
    expect(generateHeadingId('Hello Über World')).toMatchInlineSnapshot(
      `"hello-über-world"`,
    )
  })

  it('handles emojis by replacing with hyphens', () => {
    expect(generateHeadingId('Hello 😀 World')).toMatchInlineSnapshot(
      `"hello-world"`,
    )
  })

  it('handles accented characters', () => {
    expect(generateHeadingId('Café résumé')).toMatchInlineSnapshot(
      `"café-résumé"`,
    )
  })

  it('handles mixed case with numbers and special characters', () => {
    expect(generateHeadingId('Test#123: Hello-World!')).toMatchInlineSnapshot(
      `"test-123-hello-world"`,
    )
  })

  it('handles multiple spaces between words', () => {
    expect(generateHeadingId('Hello     World')).toMatchInlineSnapshot(
      `"hello-world"`,
    )
  })

  it('handles tabs and newlines', () => {
    expect(generateHeadingId('Hello\tWorld\nTest')).toMatchInlineSnapshot(
      `"hello-world-test"`,
    )
  })

  it('preserves single hyphens between words', () => {
    expect(generateHeadingId('well-formed-heading')).toMatchInlineSnapshot(
      `"well-formed-heading"`,
    )
  })

  it('handles parentheses and brackets', () => {
    expect(generateHeadingId('Section (1) [Draft]')).toMatchInlineSnapshot(
      `"section-1-draft"`,
    )
  })

  it('handles apostrophes and quotes', () => {
    expect(generateHeadingId('It\'s a "test"')).toMatchInlineSnapshot(
      `"it-s-a-test"`,
    )
  })

  it('handles mathematical symbols', () => {
    expect(generateHeadingId('2 + 2 = 4')).toMatchInlineSnapshot(`"2-2-4"`)
  })
})
