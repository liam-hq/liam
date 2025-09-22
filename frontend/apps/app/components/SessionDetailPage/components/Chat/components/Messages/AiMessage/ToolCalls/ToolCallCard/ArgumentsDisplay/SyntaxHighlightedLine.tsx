import clsx from 'clsx'
import type { FC } from 'react'
import styles from './SyntaxHighlightedLine.module.css'

type Props = {
  line: string
  isAnimated: boolean
  index: number
}

export const SyntaxHighlightedLine: FC<Props> = ({
  line,
  isAnimated,
  index,
}) => {
  // Simple parsing without dangerouslySetInnerHTML
  const renderLine = () => {
    // Check for action keywords at the start
    // Matches both snake_case (e.g., foreign_key) and regular case (e.g., FOREIGN KEY)
    const actionPattern =
      /^(\s*)(Creating table|Adding column|Adding index|Adding primary[_ ]key|Adding foreign[_ ]key|Adding FOREIGN KEY|Adding PRIMARY KEY|Adding constraint|Adding unique|Removing|Updating|Enabling extension|Creating enum)/i
    const actionMatch = line.match(actionPattern)

    if (actionMatch) {
      const [, spaces, action] = actionMatch
      const rest = line.slice(actionMatch[0].length)

      return (
        <>
          {spaces}
          <span className={styles.syntaxAction}>{action}</span>
          {renderRestOfLine(rest)}
        </>
      )
    }

    // Check for property pattern (key: value)
    const propertyPattern = /^(\s*)(\w+):\s*(.*)$/
    const propertyMatch = line.match(propertyPattern)

    if (propertyMatch) {
      const [, spaces, property, value] = propertyMatch
      return (
        <>
          {spaces}
          <span className={styles.syntaxProperty}>{property}</span>
          {': '}
          {value}
        </>
      )
    }

    return line
  }

  const renderRestOfLine = (text: string) => {
    // Handle quoted strings
    const parts = text.split(/('([^']+)')/g)

    return parts.map((part, i) => {
      if (i % 3 === 1) {
        // This is a quoted string
        return (
          <span key={`quote-${i}-${part}`} className={styles.syntaxIdentifier}>
            {part}
          </span>
        )
      }

      // Check for type in parentheses
      if (part.includes('(') && part.includes(')')) {
        const typeMatch = part.match(/\(([^)]+)\)/)
        if (typeMatch) {
          const before = part.substring(0, typeMatch.index || 0)
          const typeContent = typeMatch[1]
          const after = part.substring(
            (typeMatch.index || 0) + typeMatch[0].length,
          )

          return (
            <span key={`type-${i}-${part}`}>
              {before}
              {'('}
              <span className={styles.syntaxType}>{typeContent}</span>
              {')'}
              {after}
            </span>
          )
        }
      }

      return <span key={`text-${i}-${part}`}>{part}</span>
    })
  }

  return (
    <div
      className={clsx(
        styles.line,
        isAnimated ? styles.animated : styles.static,
      )}
      style={
        isAnimated
          ? {
              '--animation-delay': `${index * 0.05}s`,
            }
          : undefined
      }
    >
      {renderLine()}
    </div>
  )
}
