type CustomEvent = {
  event: string
  name?: string
  data?: unknown
  metadata?: unknown
}

export async function* customEventIterator(stream: AsyncIterable<CustomEvent>) {
  for await (const ev of stream) {
    if (ev.event === 'on_custom_event' && ev.name) {
      yield {
        event: ev.name,
        data: [ev.data, ev.metadata],
      }
    }
  }
}
