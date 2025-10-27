import { describe, expect, it } from 'vitest'
import { extractTocItems, parseHeading } from '../extractTocItems'

describe('parseHeading', () => {
  it('parses level 1 heading', () => {
    const slugCountMap = new Map<string, number>()
    expect(parseHeading('# Main Title', slugCountMap)).toMatchInlineSnapshot(`
      {
        "id": "main-title",
        "level": 1,
        "text": "Main Title",
      }
    `)
  })

  it('parses level 2 heading', () => {
    const slugCountMap = new Map<string, number>()
    expect(
      parseHeading('## Section Title', slugCountMap),
    ).toMatchInlineSnapshot(`
      {
        "id": "section-title",
        "level": 2,
        "text": "Section Title",
      }
    `)
  })

  it('parses level 5 heading', () => {
    const slugCountMap = new Map<string, number>()
    expect(
      parseHeading('##### Deep Section', slugCountMap),
    ).toMatchInlineSnapshot(`
      {
        "id": "deep-section",
        "level": 5,
        "text": "Deep Section",
      }
    `)
  })

  it('returns null for level 6 heading', () => {
    const slugCountMap = new Map<string, number>()
    expect(parseHeading('###### Too Deep', slugCountMap)).toBeNull()
  })

  it('returns null for non-heading text', () => {
    const slugCountMap = new Map<string, number>()
    expect(parseHeading('Regular text', slugCountMap)).toBeNull()
  })

  it('returns null for heading without space after hash', () => {
    const slugCountMap = new Map<string, number>()
    expect(parseHeading('#NoSpace', slugCountMap)).toBeNull()
  })

  it('returns null for heading with only whitespace', () => {
    const slugCountMap = new Map<string, number>()
    expect(parseHeading('#    ', slugCountMap)).toBeNull()
  })

  it('handles heading with special characters', () => {
    const slugCountMap = new Map<string, number>()
    expect(
      parseHeading('## Section (1) - Test!', slugCountMap),
    ).toMatchInlineSnapshot(`
      {
        "id": "section-1---test",
        "level": 2,
        "text": "Section (1) - Test!",
      }
    `)
  })

  it('handles duplicate headings with counter', () => {
    const slugCountMap = new Map<string, number>()

    const first = parseHeading('# Test', slugCountMap)
    expect(first).toMatchInlineSnapshot(`
      {
        "id": "test",
        "level": 1,
        "text": "Test",
      }
    `)

    const second = parseHeading('# Test', slugCountMap)
    expect(second).toMatchInlineSnapshot(`
      {
        "id": "test-2",
        "level": 1,
        "text": "Test",
      }
    `)

    const third = parseHeading('# Test', slugCountMap)
    expect(third).toMatchInlineSnapshot(`
      {
        "id": "test-3",
        "level": 1,
        "text": "Test",
      }
    `)
  })

  it('tracks different heading texts separately', () => {
    const slugCountMap = new Map<string, number>()

    parseHeading('# First', slugCountMap)
    parseHeading('# Second', slugCountMap)
    parseHeading('# First', slugCountMap)

    expect(slugCountMap.get('first')).toBe(2)
    expect(slugCountMap.get('second')).toBe(1)
  })
})

describe('extractTocItems', () => {
  it('extracts single heading', () => {
    const content = '# Main Title'
    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "main-title",
          "level": 1,
          "text": "Main Title",
        },
      ]
    `)
  })

  it('extracts multiple headings', () => {
    const content = `# Title
## Subtitle
### Sub-subtitle`

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "title",
          "level": 1,
          "text": "Title",
        },
        {
          "id": "subtitle",
          "level": 2,
          "text": "Subtitle",
        },
        {
          "id": "sub-subtitle",
          "level": 3,
          "text": "Sub-subtitle",
        },
      ]
    `)
  })

  it('ignores non-heading lines', () => {
    const content = `# Title
This is paragraph text
## Section
Another paragraph
### Subsection`

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "title",
          "level": 1,
          "text": "Title",
        },
        {
          "id": "section",
          "level": 2,
          "text": "Section",
        },
        {
          "id": "subsection",
          "level": 3,
          "text": "Subsection",
        },
      ]
    `)
  })

  it('handles duplicate headings with unique IDs', () => {
    const content = `# Introduction
## Overview
# Introduction
## Overview`

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "introduction",
          "level": 1,
          "text": "Introduction",
        },
        {
          "id": "overview",
          "level": 2,
          "text": "Overview",
        },
        {
          "id": "introduction-2",
          "level": 1,
          "text": "Introduction",
        },
        {
          "id": "overview-2",
          "level": 2,
          "text": "Overview",
        },
      ]
    `)
  })

  it('returns empty array for content without headings', () => {
    const content = `Just some text
Without any headings
Multiple lines of content`

    expect(extractTocItems(content)).toMatchInlineSnapshot('[]')
  })

  it('returns empty array for empty content', () => {
    expect(extractTocItems('')).toMatchInlineSnapshot('[]')
  })

  it('handles mixed heading levels', () => {
    const content = `# Level 1
##### Level 5
## Level 2
#### Level 4
### Level 3`

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "level-1",
          "level": 1,
          "text": "Level 1",
        },
        {
          "id": "level-5",
          "level": 5,
          "text": "Level 5",
        },
        {
          "id": "level-2",
          "level": 2,
          "text": "Level 2",
        },
        {
          "id": "level-4",
          "level": 4,
          "text": "Level 4",
        },
        {
          "id": "level-3",
          "level": 3,
          "text": "Level 3",
        },
      ]
    `)
  })

  it('processes all lines including those in code blocks', () => {
    // Note: Current implementation doesn't parse markdown code blocks
    // It will treat # inside code blocks as headings
    const content = `# Title
\`\`\`javascript
# This is not a heading
const code = true
\`\`\`
## Real Heading`

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "title",
          "level": 1,
          "text": "Title",
        },
        {
          "id": "this-is-not-a-heading",
          "level": 1,
          "text": "This is not a heading",
        },
        {
          "id": "real-heading",
          "level": 2,
          "text": "Real Heading",
        },
      ]
    `)
  })

  it('handles headings with inline code', () => {
    const content = '## Using `code` in heading'

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "using-code-in-heading",
          "level": 2,
          "text": "Using code in heading",
        },
      ]
    `)
  })

  it('handles headings with emojis', () => {
    const content = '# 🚀 Getting Started'

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "getting-started",
          "level": 1,
          "text": "🚀 Getting Started",
        },
      ]
    `)
  })

  it('preserves exact heading text while generating clean IDs', () => {
    const content = `# Test: Special-Characters!
## 100% Complete
### [Draft] Work in Progress`

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "test-special-characters",
          "level": 1,
          "text": "Test: Special-Characters!",
        },
        {
          "id": "100-complete",
          "level": 2,
          "text": "100% Complete",
        },
        {
          "id": "draft-work-in-progress",
          "level": 3,
          "text": "[Draft] Work in Progress",
        },
      ]
    `)
  })

  it('strips bold/italic/strikethrough decorations from text and id', () => {
    const content =
      '## Section **Title**\n### This is _nice_\n#### ~~Deprecated~~ API'

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "section-title",
          "level": 2,
          "text": "Section Title",
        },
        {
          "id": "this-is-nice",
          "level": 3,
          "text": "This is nice",
        },
        {
          "id": "deprecated-api",
          "level": 4,
          "text": "Deprecated API",
        },
      ]
    `)
  })

  it('removes HTML tags and stray angle brackets from headings', () => {
    const content = '## Hello <em>world</em> & beyond\n### 1 < 2 and 3 > 2'

    expect(extractTocItems(content)).toMatchInlineSnapshot(`
      [
        {
          "id": "hello-world-beyond",
          "level": 2,
          "text": "Hello world & beyond",
        },
        {
          "id": "1-2-and-3-2",
          "level": 3,
          "text": "1 2 and 3 2",
        },
      ]
    `)
  })
})
