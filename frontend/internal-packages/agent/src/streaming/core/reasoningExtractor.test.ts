import { AIMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import {
  extractReasoningFromMessage,
  extractReasoningMetadataFromMessage,
} from './reasoningExtractor'

describe('extractReasoningFromMessage', () => {
  it('extracts reasoning text from message with reasoning', () => {
    const message = new AIMessage({
      content: 'Final answer',
      additional_kwargs: {
        reasoning: {
          id: 'reasoning-123',
          type: 'reasoning',
          summary: [
            {
              type: 'summary_text',
              text: 'First thought',
              index: 0,
            },
            {
              type: 'summary_text',
              text: 'Second thought',
              index: 1,
            },
          ],
        },
      },
    })

    const result = extractReasoningFromMessage(message)

    expect(result).toBe('First thought\n\nSecond thought')
  })

  it('returns null when no reasoning is present', () => {
    const message = new AIMessage({
      content: 'Final answer',
      additional_kwargs: {},
    })

    const result = extractReasoningFromMessage(message)

    expect(result).toBeNull()
  })

  it('filters out empty text entries', () => {
    const message = new AIMessage({
      content: 'Final answer',
      additional_kwargs: {
        reasoning: {
          id: 'reasoning-123',
          type: 'reasoning',
          summary: [
            {
              type: 'summary_text',
              text: 'First thought',
              index: 0,
            },
            {
              type: 'summary_text',
              text: '',
              index: 1,
            },
            {
              type: 'summary_text',
              text: 'Third thought',
              index: 2,
            },
          ],
        },
      },
    })

    const result = extractReasoningFromMessage(message)

    expect(result).toBe('First thought\n\nThird thought')
  })
})

describe('extractReasoningMetadataFromMessage', () => {
  it('extracts duration when present', () => {
    const message = new AIMessage({
      content: 'Final answer',
      additional_kwargs: {
        reasoning_duration_ms: 3250,
      },
    })

    const result = extractReasoningMetadataFromMessage(message)

    expect(result).toEqual({
      durationMs: 3250,
    })
  })

  it('returns null when no metadata is present', () => {
    const message = new AIMessage({
      content: 'Final answer',
      additional_kwargs: {},
    })

    const result = extractReasoningMetadataFromMessage(message)

    expect(result).toBeNull()
  })

  it('returns null when additional_kwargs is invalid', () => {
    const message = new AIMessage({
      content: 'Final answer',
      additional_kwargs: {
        reasoning_duration_ms: 'invalid', // Wrong type
      },
    })

    const result = extractReasoningMetadataFromMessage(message)

    expect(result).toBeNull()
  })
})
