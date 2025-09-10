export const highlightSyntax = (text: string): string => {
  // Escape HTML
  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  let html = escapeHtml(text)

  // SQL keywords
  const sqlKeywords = [
    'NOT NULL',
    'UNIQUE',
    'DEFAULT',
    'PRIMARY KEY',
    'FOREIGN KEY',
    'CREATE',
    'TABLE',
    'INDEX',
    'ON',
    'true',
    'false',
  ]

  // Actions
  const actions = [
    'Creating table',
    'Adding column',
    'Adding index',
    'Adding primary_key',
    'Adding foreign_key',
    'Adding unique',
    'Removing table',
    'Removing column',
    'Updating column',
  ]

  // Actions (Creating, Adding, Removing, Updating)
  actions.forEach((action) => {
    const regex = new RegExp(`^(\\s*)(${action})`, 'gi')
    html = html.replace(regex, '$1<span class="syntax-action">$2</span>')
  })

  // Table names, column names, index names (single-quoted strings)
  html = html.replace(
    /&#39;([^&#39;]+)&#39;/g,
    '<span class="syntax-identifier">&#39;$1&#39;</span>',
  )

  // Type information (types in parentheses)
  html = html.replace(/\(([^)]+)\)/g, (_, content) => {
    // Highlight SQL keywords
    let highlightedContent = content
    sqlKeywords.forEach((keyword) => {
      const keywordRegex = new RegExp(`\\b(${keyword})\\b`, 'gi')
      highlightedContent = String(highlightedContent).replace(
        keywordRegex,
        '<span class="syntax-keyword">$1</span>',
      )
    })

    // Type names (uuid, varchar, timestamp, etc.)
    const typeRegex =
      /\b(uuid|varchar|text|boolean|timestamp|integer|bigint|smallint|numeric|decimal|real|double precision|json|jsonb|array|date|time|interval)\b/gi
    highlightedContent = String(highlightedContent).replace(
      typeRegex,
      '<span class="syntax-type">$1</span>',
    )

    // Numbers
    highlightedContent = String(highlightedContent).replace(
      /\b(\d+)\b/g,
      '<span class="syntax-number">$1</span>',
    )

    return `(<span class="syntax-parens">${highlightedContent}</span>)`
  })

  // Foreign key references (arrows)
  html = html.replace(/-&gt;/g, '<span class="syntax-arrow">→</span>')

  // Property names (strings before colon)
  html = html.replace(
    /^(\s*)(\w+):/gm,
    '$1<span class="syntax-property">$2</span>:',
  )

  return html
}
