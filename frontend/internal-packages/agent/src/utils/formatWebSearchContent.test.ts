import { describe, expect, it } from 'vitest'
import { formatWebSearchContent } from './formatWebSearchContent'

describe('formatWebSearchContent', () => {
  describe('array of web search result items', () => {
    it('should format single item array from real web search results (observed format)', () => {
      const content = [
        {
          type: 'text',
          text: "Designing a normalized database schema for a business management system involves creating tables that effectively represent the organization's structure...",
        },
      ]

      const result = formatWebSearchContent(content)
      expect(result).toMatchInlineSnapshot(
        `"Designing a normalized database schema for a business management system involves creating tables that effectively represent the organization's structure..."`,
      )
    })

    it('should format single item array from documented API format', () => {
      const content = [
        {
          type: 'output_text',
          text: 'Database design best practices for enterprise applications...',
        },
      ]

      const result = formatWebSearchContent(content)
      expect(result).toMatchInlineSnapshot(
        `"Database design best practices for enterprise applications..."`,
      )
    })

    it('should format multiple items with separators', () => {
      const content = [
        {
          type: 'output_text',
          text: 'First search result content',
        },
        {
          type: 'output_text',
          text: 'Second search result content',
        },
      ]

      const result = formatWebSearchContent(content)
      expect(result).toMatchInlineSnapshot(`
        "## Search Result 1

        First search result content

        ---

        ## Search Result 2

        Second search result content"
      `)
    })

    it('should handle content with annotations', () => {
      const content = [
        {
          type: 'output_text',
          text: 'Content with citations',
          annotations: [
            {
              type: 'url_citation',
              start_index: 0,
              end_index: 20,
              url: 'https://example.com',
              title: 'Example Source',
            },
          ],
        },
      ]

      const result = formatWebSearchContent(content)
      expect(result).toMatchInlineSnapshot(`
        "Content with citations

        [Example Source](https://example.com)"
      `)
    })

    it('should handle empty array', () => {
      expect(formatWebSearchContent([])).toBe('')
    })
  })

  describe('edge cases', () => {
    it('should handle non-array content with JSON fallback', () => {
      const content = {
        randomField: 'value',
        anotherField: 123,
      }

      const result = formatWebSearchContent(content)
      expect(result).toContain('```json')
      expect(result).toContain('"randomField": "value"')
      expect(result).toContain('```')
    })
  })
})
