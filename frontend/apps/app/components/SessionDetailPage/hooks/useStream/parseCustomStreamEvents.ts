import {
  type CustomStreamEvent,
  customStreamEventSchema,
} from '@liam-hq/agent/client'
import * as v from 'valibot'
import { parseSse } from './parseSse'

export async function* parseCustomStreamEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<CustomStreamEvent, void, unknown> {
  for await (const _ev of parseSse(stream)) {
    const ev = {
      event: _ev.event,
      data: JSON.parse(_ev.data),
    }
    const parsed = v.safeParse(customStreamEventSchema, ev)
    if (!parsed.success) {
      console.warn('[parseCustomStreamEvents] Invalid event structure')
      continue
    }

    yield parsed.output
  }
}
