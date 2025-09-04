type SSEEvent = {
  event: string
  data: string
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
export async function* parseSse(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')

  let buffer = ''
  let event: Partial<SSEEvent> = {}
  let dataLines: string[] = []

  const flush = () => {
    if (dataLines.length === 0) return
    const e: SSEEvent = {
      event: event.event ?? 'message',
      data: dataLines.join('\n'),
    }
    event = {}
    dataLines = []
    return e
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      // Flush any pending bytes from the decoder (handles multi-byte code points at chunk boundaries)
      buffer += decoder.decode()
    } else {
      buffer += decoder.decode(value, { stream: true })
    }

    while (true) {
      const nl = buffer.indexOf('\n')
      if (nl === -1) break
      const rawLine = buffer.slice(0, nl)
      buffer = buffer.slice(nl + 1)

      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
      if (line === '') {
        const ev = flush()
        if (ev) yield ev
      }

      if (line.startsWith(':')) continue

      const [field, ...rest] = line.split(':')
      const valueStr = rest.join(':').replace(/^ /, '')
      switch (field) {
        case 'event':
          event.event = valueStr
          break
        case 'data':
          dataLines.push(valueStr)
          break
      }
    }

    if (done) break
  }

  const ev = flush()
  if (ev) yield ev
}
