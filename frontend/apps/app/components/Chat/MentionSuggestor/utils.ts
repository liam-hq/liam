// Type for highlighted label parts
type HighlightedLabelParts = {
  before: string
  match: string
  after: string
}

// Extract the current query after the trigger (e.g. after "@")
export function getQuery(
  input: string,
  caret: number,
  trigger: string,
): string {
  const before = input.slice(0, caret)
  const match = new RegExp(`\\${trigger}([\\w-]*)$`).exec(before)
  return match ? match[1] : ''
}

// Render label text by splitting it into matching and non-matching parts
export function renderHighlightedLabel(
  label: string,
  query: string,
): string | HighlightedLabelParts {
  if (!query) return label // If query is empty, display the label as is

  const lowerLabel = label.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerLabel.indexOf(lowerQuery)

  if (index === -1) return label // If no match is found, display the label as is

  const before = label.substring(0, index)
  const match = label.substring(index, index + query.length)
  const after = label.substring(index + query.length)

  // Return parts that can be used to construct a highlighted label
  return { before, match, after }
}
