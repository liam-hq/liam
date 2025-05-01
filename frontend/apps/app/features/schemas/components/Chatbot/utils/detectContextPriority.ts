/**
 * Utility for detecting context priority based on input text
 * Used to determine which mention type should be prioritized
 */

export type ContextPriority = 'agent' | 'schemaItem' | 'tableGroup' | null

// Keywords that indicate agent-related context
const AGENT_KEYWORDS = ['agent', 'jack', 'ai', 'builder', 'reviewer', 'learn']

// Keywords that indicate schema-related context
const SCHEMA_KEYWORDS = ['table', 'column', 'schema', 'field', 'database']

// Keywords that indicate table group-related context
const TABLE_GROUP_KEYWORDS = ['group', 'table g', 'group name']

/**
 * Analyzes the preceding text to determine context priority
 * @param text The text preceding the @ symbol
 * @returns The detected context priority
 */
export function detectContextPriority(text: string): ContextPriority {
  // Get the last 3-5 words from the text
  const words = text.trim().split(/\s+/).slice(-5)
  const context = words.join(' ').toLowerCase()

  // Special case: if context contains "j", "ja", "jac", "jack", or "agent" as a word or word starting with "j" or "agent"
  const contextWords = context.split(/\s+/)
  if (
    contextWords.some(
      (word) =>
        word === 'j' ||
        word === 'ja' ||
        word === 'jac' ||
        word === 'jack' ||
        word.startsWith('j') ||
        word === 'agent' ||
        word.startsWith('agent'),
    )
  ) {
    return 'agent'
  }

  // Check for table group keywords first (highest priority)
  if (TABLE_GROUP_KEYWORDS.some((keyword) => context.includes(keyword))) {
    return 'tableGroup'
  }

  // Check for agent keywords
  if (AGENT_KEYWORDS.some((keyword) => context.includes(keyword))) {
    return 'agent'
  }

  // Check for schema keywords
  if (SCHEMA_KEYWORDS.some((keyword) => context.includes(keyword))) {
    return 'schemaItem'
  }

  // Default: no specific context detected
  return null
}
