import type { FC } from 'react'

// Add global style for animation and syntax highlighting
if (
  typeof document !== 'undefined' &&
  !document.getElementById('syntax-line-styles')
) {
  const style = document.createElement('style')
  style.id = 'syntax-line-styles'
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .syntax-action {
      color: #ff6b9d;
      font-weight: 600;
    }
    .syntax-identifier {
      color: #85e89d;
    }
    .syntax-type {
      color: #4ecdc4;
    }
    .syntax-keyword {
      color: #ff6b9d;
      font-weight: 600;
    }
    .syntax-number {
      color: #ffd93d;
    }
    .syntax-property {
      color: #85e89d;
    }
    .syntax-arrow {
      color: #ff8c42;
      font-weight: 600;
    }
    .syntax-parens {
      color: #ffffff;
    }
  `
  document.head.appendChild(style)
}

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
          <span className="syntax-action">{action}</span>
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
          <span className="syntax-property">{property}</span>
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
          <span key={`quote-${i}-${part}`} className="syntax-identifier">
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
              <span className="syntax-type">{typeContent}</span>
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
      style={
        isAnimated
          ? {
              animationDelay: `${index * 0.05}s`,
              padding: 'var(--spacing-1) 0',
              minHeight: '1.5em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              animation: 'fadeIn 0.3s ease forwards',
              opacity: 0,
            }
          : {
              padding: 'var(--spacing-1) 0',
              minHeight: '1.5em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              opacity: 1,
            }
      }
    >
      {renderLine()}
    </div>
  )
}
