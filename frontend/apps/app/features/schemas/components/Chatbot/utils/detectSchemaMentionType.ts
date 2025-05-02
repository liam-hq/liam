/**
 * Utility for detecting schema mention type based on input text
 * Used to filter schema items in the dropdown
 */

export type SchemaMentionType = 'table' | 'tableGroup' | 'column' | null

/**
 * Detects the schema mention type from the input text
 * @param triggerText The text after the @ symbol
 * @returns The detected schema mention type or null if no specific type is detected
 */
export function detectSchemaMentionType(
  triggerText: string,
): SchemaMentionType {
  // Normalize the input text (lowercase, trim spaces)
  const normalizedText = triggerText.toLowerCase().trim()

  // Check for "table"
  if (normalizedText === 'table' || normalizedText.startsWith('table ')) {
    return 'table'
  }

  // Check for "group"
  if (normalizedText === 'group' || normalizedText.startsWith('group ')) {
    return 'tableGroup'
  }

  // Check for "column"
  if (normalizedText === 'column' || normalizedText.startsWith('column ')) {
    return 'column'
  }

  // No specific type detected
  return null
}
