type StreamEvent = {
  event: string
  name: string
  data: unknown
  metadata: unknown
}

export const isLangChainStreamEvent = (
  value: unknown,
): value is StreamEvent => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    value.event === 'on_custom_event' &&
    'name' in value &&
    'data' in value &&
    'metadata' in value
  )
}

export const isMetadataRecord = (
  value: unknown,
): value is Record<string, unknown> | undefined => {
  return (
    value === undefined ||
    (typeof value === 'object' && value !== null && !Array.isArray(value))
  )
}
