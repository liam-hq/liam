/**
 * Enhances message content with appropriate emojis based on the text patterns
 */
const enhanceMessageWithEmojis = (content: string): string => {
  // Define emoji mappings for different patterns
  const emojiMappings = [
    // Status indicators
    { pattern: /^analyzing requirements/i, emoji: '📊' },
    { pattern: /^organizing business/i, emoji: '📋' },
    { pattern: /^requirements analysis completed/i, emoji: '✅' },

    // Database and schema operations
    { pattern: /^designing database schema/i, emoji: '🏗️' },
    { pattern: /^creating database/i, emoji: '💾' },
    { pattern: /^generated ddl statements/i, emoji: '📝' },
    { pattern: /^executing ddl statements/i, emoji: '⚡' },
    { pattern: /^applied \d+ schema changes/i, emoji: '✅' },
    { pattern: /^schema design completed/i, emoji: '🎉' },

    // Table and relationship operations
    { pattern: /^analyzing table structure/i, emoji: '🔍' },
    { pattern: /^applying schema changes/i, emoji: '🔧' },
    { pattern: /^created new schema version/i, emoji: '📦' },

    // Error handling
    { pattern: /^error recovery/i, emoji: '🔧' },
    { pattern: /^redesigning schema to fix/i, emoji: '🛠️' },
    { pattern: /^generating use cases/i, emoji: '📋' },
    { pattern: /^analyzing test cases/i, emoji: '🧪' },

    // Completion status
    { pattern: /completed$/i, emoji: ' ✨' },
    { pattern: /successfully$/i, emoji: ' 🎉' },
    { pattern: /failed$/i, emoji: ' ❌' },
    { pattern: /error$/i, emoji: ' ⚠️' },
  ]

  let enhancedContent = content

  // Apply emoji mappings
  emojiMappings.forEach(({ pattern, emoji }) => {
    enhancedContent = enhancedContent.replace(pattern, (match) => {
      // Check if emoji already exists at the beginning or end
      const lineStart =
        enhancedContent.lastIndexOf('\n', enhancedContent.indexOf(match)) + 1
      const lineEnd = enhancedContent.indexOf(
        '\n',
        enhancedContent.indexOf(match),
      )
      const line = enhancedContent.substring(
        lineStart,
        lineEnd === -1 ? enhancedContent.length : lineEnd,
      )

      // Don't add emoji if one already exists
      if (/^[^\w\s]/.test(line.trim())) {
        return match
      }

      // Add emoji at the beginning for start patterns, at the end for end patterns
      if (pattern.source.startsWith('^')) {
        return `${emoji} ${match}`
      }
      if (pattern.source.endsWith('$')) {
        return `${match}${emoji}`
      }
      return `${emoji} ${match}`
    })
  })

  return enhancedContent
}

/**
 * Adds status indicators (✓, ✗, ⏳) to task lines based on keywords
 */
const addStatusIndicators = (content: string): string => {
  const lines = content.split('\n')

  const enhancedLines = lines.map((line) => {
    const trimmedLine = line.trim()

    // Skip if already has an indicator
    if (
      trimmedLine.includes('✓') ||
      trimmedLine.includes('✗') ||
      trimmedLine.includes('⏳')
    ) {
      return line
    }

    // Add indicators based on content
    if (
      trimmedLine.match(
        /^(completed|finished|done|applied|created|generated|analyzed|organized)/i,
      ) ||
      trimmedLine.match(/(completed|successfully|finished)$/i)
    ) {
      return line.replace(trimmedLine, `✓ ${trimmedLine}`)
    }
    if (
      trimmedLine.match(/^(failed|error|unable)/i) ||
      trimmedLine.match(/(failed|error)$/i)
    ) {
      return line.replace(trimmedLine, `✗ ${trimmedLine}`)
    }
    if (
      trimmedLine.match(
        /^(processing|analyzing|creating|designing|executing|applying|generating)/i,
      ) &&
      !trimmedLine.match(/(completed|successfully|finished)$/i)
    ) {
      // Only add hourglass for ongoing actions
      return line.replace(trimmedLine, `⏳ ${trimmedLine}`)
    }

    return line
  })

  return enhancedLines.join('\n')
}

/**
 * Enhance message with both emojis and status indicators
 */
export const enhanceMessage = (content: string): string => {
  // First add status indicators
  let enhanced = addStatusIndicators(content)

  // Then add emojis
  enhanced = enhanceMessageWithEmojis(enhanced)

  return enhanced
}
