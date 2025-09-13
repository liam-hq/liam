export const formatToolCallArgs = (args: Record<string, unknown>): string => {
  const entries = Object.entries(args)
  if (entries.length === 0) return ''

  // Display max 2 key-value pairs
  const displayEntries = entries.slice(0, 2)
  const formatted = displayEntries
    .map(([key, value]) => `${key}: ${formatValue(value)}`)
    .join(', ')

  const remaining = entries.length - displayEntries.length
  return remaining > 0 ? `${formatted}, +${remaining} more` : formatted
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return String(value)
  }

  if (Array.isArray(value)) {
    return formatArrayValue(value)
  }

  if (typeof value === 'object') {
    return formatObjectValue(value)
  }

  if (typeof value === 'string') {
    return formatStringValue(value)
  }

  return String(value) // number, boolean, etc.
}

const formatArrayValue = (arr: unknown[]): string => {
  if (arr.length === 0) return '[]'

  if (arr.length <= 3) {
    // Short arrays with objects are summarized for readability
    const hasObjects = arr.some(
      (item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    )

    if (hasObjects) {
      return `[${arr.length} items]`
    }

    // Short arrays with only primitives show all elements
    const elements = arr.map((item) => formatValue(item)).join(', ')
    return `[${elements}]`
  }

  // Long arrays are summarized
  return `[${arr.length} items]`
}

const isRecord = (obj: unknown): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

const formatObjectValue = (obj: unknown): string => {
  if (!isRecord(obj)) {
    return String(obj)
  }

  const keys = Object.keys(obj)
  if (keys.length === 0) return '{}'

  if (keys.length <= 2) {
    // Small objects show their content
    const entries = Object.entries(obj)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(', ')
    return `{${entries}}`
  }

  // Large objects show only key count
  return `{${keys.length} keys}`
}

const formatStringValue = (str: string): string => {
  const maxLength = 20

  if (str.length <= maxLength) {
    return `"${str}"`
  }

  // Long strings are truncated from the beginning
  return `"${str.slice(0, maxLength - 3)}..."`
}
