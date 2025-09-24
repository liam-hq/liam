type StreamEvent = {
  event: string
  name: string
  data: unknown
  metadata: unknown
}

type CustomEventResult = {
  event: string
  data: [unknown, unknown]
}

export const customEventIterator = async function* (
  stream: AsyncIterable<StreamEvent>,
): AsyncGenerator<CustomEventResult> {
  for await (const ev of stream) {
    if (ev.event === 'on_custom_event') {
      yield {
        event: ev.name,
        data: [ev.data, ev.metadata],
      }
    }
  }
}
