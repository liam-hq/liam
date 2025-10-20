import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessageChunk } from '@langchain/core/messages'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamLLMResponse } from './streamingLlmUtils'

vi.mock('@langchain/core/callbacks/dispatch', () => ({
  dispatchCustomEvent: vi.fn().mockResolvedValue(undefined),
}))

describe('streamLLMResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('attaches reasoning metadata with timing when reasoning output is present', async () => {
    const chunk = new AIMessageChunk({
      id: 'chunk-id',
      name: 'db',
      content: [
        {
          type: 'text',
          text: 'Final answer',
        },
      ],
      additional_kwargs: {
        reasoning: {
          id: 'reasoning-id',
          type: 'reasoning',
          summary: [
            {
              type: 'summary_text',
              index: 0,
              text: 'Reasoning step',
            },
          ],
        },
      },
    })

    async function* chunkStream() {
      yield chunk
    }

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000',
    )

    const startMs = 1_000
    const finishMs = 4_250

    const dateNowSpy = vi.spyOn(Date, 'now')
    dateNowSpy.mockImplementationOnce(() => startMs)
    dateNowSpy.mockImplementationOnce(() => finishMs)

    const result = await streamLLMResponse(chunkStream(), {
      agentName: 'db',
    })

    expect(result.id).toBe('00000000-0000-4000-8000-000000000000')
    expect(result.additional_kwargs['reasoning_duration_ms']).toBe(
      finishMs - startMs,
    )
  })

  it('skips timing metadata when reasoning output is absent', async () => {
    const chunk = new AIMessageChunk({
      id: 'chunk-id',
      content: [
        {
          type: 'text',
          text: 'Final answer',
        },
      ],
      additional_kwargs: {},
    })

    async function* chunkStream() {
      yield chunk
    }

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000',
    )

    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(42)

    const result = await streamLLMResponse(chunkStream(), {
      agentName: 'db',
    })

    expect(result.additional_kwargs['reasoning_duration_ms']).toBeUndefined()
    // Date.now() should not be called when there's no reasoning
    expect(dateNowSpy).not.toHaveBeenCalled()
  })

  it('dispatches a chunk with reasoning_duration_ms after streaming completes', async () => {
    const chunk = new AIMessageChunk({
      id: 'chunk-id',
      name: 'db',
      content: [
        {
          type: 'text',
          text: 'Final answer',
        },
      ],
      additional_kwargs: {
        reasoning: {
          id: 'reasoning-id',
          type: 'reasoning',
          summary: [
            {
              type: 'summary_text',
              index: 0,
              text: 'Reasoning step',
            },
          ],
        },
      },
    })

    async function* chunkStream() {
      yield chunk
    }

    const mockDispatch = vi.mocked(dispatchCustomEvent)
    mockDispatch.mockClear()

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000',
    )

    const startMs = 1_000
    const finishMs = 4_250
    const expectedDuration = finishMs - startMs

    const dateNowSpy = vi.spyOn(Date, 'now')
    dateNowSpy.mockImplementationOnce(() => startMs)
    dateNowSpy.mockImplementationOnce(() => finishMs)

    await streamLLMResponse(chunkStream(), {
      agentName: 'db',
    })

    // Should dispatch the original chunk + duration chunk
    expect(mockDispatch).toHaveBeenCalledTimes(2)

    // Check the last call is the duration chunk
    const lastCall = mockDispatch.mock.calls[1]
    expect(lastCall).toBeDefined()
    if (!lastCall) return

    expect(lastCall[0]).toBe('messages')

    const durationChunk = lastCall[1]
    expect(durationChunk).toBeInstanceOf(AIMessageChunk)
    if (!(durationChunk instanceof AIMessageChunk)) return
    expect(durationChunk.id).toBe('00000000-0000-4000-8000-000000000000')
    expect(durationChunk.name).toBe('db')
    expect(durationChunk.content).toBe('')
    expect(durationChunk.additional_kwargs['reasoning_duration_ms']).toBe(
      expectedDuration,
    )
  })

  it('does not dispatch duration chunk when reasoning is absent', async () => {
    const chunk = new AIMessageChunk({
      id: 'chunk-id',
      content: [
        {
          type: 'text',
          text: 'Final answer',
        },
      ],
      additional_kwargs: {},
    })

    async function* chunkStream() {
      yield chunk
    }

    const mockDispatch = vi.mocked(dispatchCustomEvent)
    mockDispatch.mockClear()

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000000',
    )

    await streamLLMResponse(chunkStream(), {
      agentName: 'db',
    })

    // Should only dispatch the original chunk, not the duration chunk
    expect(mockDispatch).toHaveBeenCalledTimes(1)
  })
})
