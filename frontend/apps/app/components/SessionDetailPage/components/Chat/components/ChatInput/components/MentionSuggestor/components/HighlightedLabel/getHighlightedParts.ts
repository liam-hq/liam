type HighlightedLabelParts = {
  before: string
  match?: string
  after?: string
}

export function getHighlightedParts(
  label: string,
  query: string,
): HighlightedLabelParts {
  const lowerLabel = label.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerLabel.indexOf(lowerQuery)

  if (index === -1) {
    return { before: label }
  }

  const before = label.substring(0, index)
  const match = label.substring(index, index + query.length)
  const after = label.substring(index + query.length)

  return { before, match, after }
}
