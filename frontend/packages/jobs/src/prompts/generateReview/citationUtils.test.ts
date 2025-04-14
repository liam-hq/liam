import { describe, expect, it } from 'vitest'
import type { Review } from '../../types'
import {
  type DocumentReference,
  addCitationsToFeedback,
  calculateJaccardSimilarity,
  prepareDocumentReferences,
  rankDocumentRelevance,
  segmentText,
} from './citationUtils'

describe('segmentText', () => {
  it('should split text into chunks by paragraphs and sentences', () => {
    const text =
      'First sentence. Second sentence.\n\nNew paragraph. Another sentence.'
    const result = segmentText(text, 5)
    expect(result).toHaveLength(4)
    expect(result).toContain('First sentence.')
    expect(result).toContain('Second sentence.')
    expect(result).toContain('New paragraph.')
    expect(result).toContain('Another sentence.')
  })

  it('should filter out chunks shorter than minChunkLength', () => {
    const text = 'A. B.\n\nLonger paragraph with more words.'
    const result = segmentText(text, 15)
    expect(result).toHaveLength(1)
    expect(result).toContain('Longer paragraph with more words.')
  })

  it('should return an empty array for empty input', () => {
    const result = segmentText('', 5)
    expect(result).toHaveLength(0)
  })
})

describe('calculateJaccardSimilarity', () => {
  it('should calculate similarity between two texts', () => {
    const text1 = 'database schema design patterns'
    const text2 = 'common database schema patterns'
    const similarity = calculateJaccardSimilarity(text1, text2)
    expect(similarity).toBeCloseTo(0.6, 2)
  })

  it('should return 1 for identical texts', () => {
    const text = 'identical text content'
    const similarity = calculateJaccardSimilarity(text, text)
    expect(similarity).toBe(1)
  })

  it('should return 0 for completely different texts', () => {
    const text1 = 'database schema'
    const text2 = 'completely different words here'
    const similarity = calculateJaccardSimilarity(text1, text2)
    expect(similarity).toBe(0)
  })

  it('should handle empty strings', () => {
    expect(calculateJaccardSimilarity('', '')).toBe(0)
    expect(calculateJaccardSimilarity('text', '')).toBe(0)
    expect(calculateJaccardSimilarity('', 'text')).toBe(0)
  })

  it('should be case insensitive', () => {
    const text1 = 'Database Schema'
    const text2 = 'database schema'
    expect(calculateJaccardSimilarity(text1, text2)).toBe(1)
  })
})

describe('rankDocumentRelevance', () => {
  it('should rank documents by relevance to query', () => {
    const query = 'database schema design'
    const documents = [
      'web application frontend',
      'database schema patterns and design',
      'user interface components',
      'SQL database design principles',
    ]

    const result = rankDocumentRelevance(query, documents)
    expect(result).toHaveLength(4)

    // Most relevant document should be ranked first
    expect(result[0]?.index).toBe(1) // "database schema patterns and design"
    expect(result[1]?.index).toBe(3) // "SQL database design principles"
  })

  it('should return empty array for empty documents', () => {
    const result = rankDocumentRelevance('query', [])
    expect(result).toHaveLength(0)
  })
})

describe('prepareDocumentReferences', () => {
  it('should parse markdown sections into document references', () => {
    const markdown = `# Section 1
This is content for section 1.
More content here.

# Section 2
This is content for section 2.
With multiple paragraphs.

Second paragraph.`

    const result = prepareDocumentReferences(markdown)
    expect(result).toHaveLength(2)

    if (result[0]) {
      expect(result[0].path).toBe('Section 1')
      expect(result[0].content).toContain('content for section 1')
      expect(result[0].chunks).toBeDefined()
    }

    if (result[1]) {
      expect(result[1].path).toBe('Section 2')
      expect(result[1].content).toContain('content for section 2')
      expect(result[1].chunks).toBeDefined()
    }
  })

  it('should handle empty content', () => {
    const result = prepareDocumentReferences('')
    expect(result).toHaveLength(0)
  })

  it('should handle malformed markdown', () => {
    const malformedMarkdown = `No heading here
Just some content without proper heading structure.`

    const result = prepareDocumentReferences(malformedMarkdown)
    expect(result).toHaveLength(0)
  })
})

describe('addCitationsToFeedback', () => {
  // Mock document references with content that has high similarity to our test cases
  const docReferences: DocumentReference[] = [
    {
      path: 'naming-conventions.md',
      content:
        'Tables should use snake_case naming convention. All database tables must follow this standard.',
      chunks: [
        'Tables should use snake_case naming convention.',
        'All database tables must follow this standard.',
      ],
    },
    {
      path: 'data-types.md',
      content:
        'Use appropriate data types for columns. String columns should have length constraints.',
      chunks: [
        'Use appropriate data types for columns.',
        'String columns should have length constraints.',
      ],
    },
  ]

  // Mock review with a Project Rules Consistency feedback
  const mockReview: Review = {
    bodyMarkdown: 'This is a review of the schema changes.',
    feedbacks: [
      {
        kind: 'Project Rules Consistency',
        severity: 'WARNING',
        description:
          'The table naming does not follow snake_case convention as specified in the naming conventions.',
        suggestion: 'Rename the table to use snake_case.',
        suggestionSnippets: [
          {
            filename: 'migration.sql',
            snippet: 'ALTER TABLE "badName" RENAME TO "bad_name";',
          },
        ],
      },
      {
        kind: 'Migration Safety',
        severity: 'POSITIVE',
        description: 'The migration includes proper transaction handling.',
        suggestion: 'No suggestions needed',
        suggestionSnippets: [],
      },
    ],
  }

  it('should add citations to Project Rules Consistency feedback', () => {
    const result = addCitationsToFeedback(mockReview, docReferences)

    // Check that citations were added
    const projectRulesFeedback = result.feedbacks.find(
      (f) => f.kind === 'Project Rules Consistency',
    )
    expect(projectRulesFeedback).toBeDefined()

    expect(
      projectRulesFeedback?.description,
    ).toMatchInlineSnapshot(`The table naming does not follow snake_case convention as specified in the naming conventions. [^1]

[^1]: naming-conventions.md - Tables should use snake_case naming convention.`)
  })

  it('should not modify other feedback kinds', () => {
    const result = addCitationsToFeedback(mockReview, docReferences)

    // Check that other feedback was not modified
    const otherFeedback = result.feedbacks.find(
      (f) => f.kind === 'Migration Safety',
    )
    expect(otherFeedback?.description).toBe(
      'The migration includes proper transaction handling.',
    )
  })

  it('should handle empty document references', () => {
    const result = addCitationsToFeedback(mockReview, [])

    // Should not modify the review when no document references
    expect(result).toEqual(mockReview)
  })

  it('should handle review without Project Rules Consistency feedback', () => {
    const reviewWithoutProjectRules: Review = {
      bodyMarkdown: 'This is a review of the schema changes.',
      feedbacks: [
        {
          kind: 'Migration Safety',
          severity: 'POSITIVE',
          description: 'The migration includes proper transaction handling.',
          suggestion: 'No suggestions needed',
          suggestionSnippets: [],
        },
      ],
    }

    const result = addCitationsToFeedback(
      reviewWithoutProjectRules,
      docReferences,
    )

    // Should not modify the review when no Project Rules feedback
    expect(result).toEqual(reviewWithoutProjectRules)
  })

  it('should handle multi-paragraph descriptions', () => {
    // Creating a review with description that closely matches our doc references for better matching
    const reviewWithMultiParagraph: Review = {
      bodyMarkdown: 'This is a review of the schema changes.',
      feedbacks: [
        {
          kind: 'Project Rules Consistency',
          severity: 'WARNING',
          description:
            'Tables should use snake_case naming convention.\n\nThe violation of this standard is a serious issue.',
          suggestion: 'Rename the table to use snake_case.',
          suggestionSnippets: [],
        },
      ],
    }

    const result = addCitationsToFeedback(
      reviewWithMultiParagraph,
      docReferences,
    )

    const feedback = result.feedbacks[0]
    expect(
      feedback?.description,
    ).toMatchInlineSnapshot(`Tables should use snake_case naming convention.[^1]

The violation of this standard is a serious issue.

[^1]: naming-conventions.md - Tables should use snake_case naming convention.`)
  })
})
