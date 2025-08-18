import { AIMessageChunk } from '@langchain/core/messages'
import type { StreamEvent } from '@langchain/core/tracers/log_stream'
import { describe, expect, it } from 'vitest'
import { transformEvent } from '../transformEvent'

function createStreamEvent(
  name: string,
  dataOrChunk: unknown,
  runId = 'run-123',
  eventType = 'on_custom_event',
): StreamEvent {
  return {
    event: eventType,
    name,
    run_id: runId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
    data: dataOrChunk as any,
    metadata: {},
    tags: [],
  }
}

describe('transformEvent with AIMessageChunk.text', () => {
  describe('when text property exists', () => {
    it('should extract text from AIMessageChunk', () => {
      const chunk = new AIMessageChunk('Hello world')

      const event = createStreamEvent('pm:delta', chunk)

      const result = transformEvent(event)
      expect(result?.data.content).toBe('Hello world')
    })

    it('should handle empty text', () => {
      const chunk = new AIMessageChunk('')

      const event = createStreamEvent('pm:delta', chunk)

      const result = transformEvent(event)
      expect(result?.data.content).toBe('')
    })
  })

  describe('when text property is missing', () => {
    it('should handle undefined text gracefully', () => {
      const chunk = new AIMessageChunk('')

      const event = createStreamEvent('pm:delta', chunk)

      const result = transformEvent(event)
      expect(result?.data.content).toBe('')
    })
  })
})

describe('transformEvent', () => {
  describe('event parsing', () => {
    it('should return null for non-custom events', () => {
      const event = createStreamEvent(
        'pm:delta',
        new AIMessageChunk(''),
        'run-123',
        'on_chain_start',
      )

      const result = transformEvent(event)
      expect(result).toBeNull()
    })

    it('should return null for invalid event names', () => {
      const event = createStreamEvent(
        'invalid_format',
        new AIMessageChunk('test'),
      )

      const result = transformEvent(event)
      expect(result).toBeNull()
    })

    it('should return null for invalid role', () => {
      const event = createStreamEvent(
        'invalid:delta',
        new AIMessageChunk('test'),
      )

      const result = transformEvent(event)
      expect(result).toBeNull()
    })

    it('should return null for unknown event type', () => {
      const event = createStreamEvent('pm:unknown', new AIMessageChunk('test'))

      const result = transformEvent(event)
      expect(result).toBeNull()
    })

    it('should return null when data is not AIMessageChunk', () => {
      const event = createStreamEvent('pm:delta', 'not a chunk')

      const result = transformEvent(event)
      expect(result).toBeNull()
    })

    it('should handle delta event type', () => {
      const chunk = new AIMessageChunk('test message')

      const event = createStreamEvent('pm:delta', chunk)

      const result = transformEvent(event)
      expect(result?.event).toBe('delta')
      expect(result?.data.role).toBe('pm')
      expect(result?.data.runId).toBe('run-123')
      expect(result?.data.content).toBe('test message')
    })

    it('should handle message event type', () => {
      const chunk = new AIMessageChunk('test message')

      const event = createStreamEvent('db:message', chunk, 'run-456')

      const result = transformEvent(event)
      expect(result?.event).toBe('message')
      expect(result?.data.role).toBe('db')
      expect(result?.data.runId).toBe('run-456')
      expect(result?.data.content).toBe('test message')
    })

    it('should handle qa role', () => {
      const chunk = new AIMessageChunk('test message')

      const event = createStreamEvent('qa:delta', chunk, 'run-789')

      const result = transformEvent(event)
      expect(result?.event).toBe('delta')
      expect(result?.data.role).toBe('qa')
      expect(result?.data.runId).toBe('run-789')
      expect(result?.data.content).toBe('test message')
    })
  })
})
