import type { Meta } from '@storybook/react'
import { type KeyboardEvent, useRef, useState } from 'react'
import { MentionSuggestor } from './MentionSuggestor'

const meta: Meta<typeof MentionSuggestor> = {
  title: 'Components/ChatInput/MentionSuggestor',
  component: MentionSuggestor,
}
export default meta

const _schema = {
  tables: {
    users: {
      name: 'users',
      columns: {
        id: {
          name: 'id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
        user_id: {
          name: 'user_id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
      },
      comment: null,
      constraints: {},
      indexes: {},
    },
    posts: {
      name: 'posts',
      columns: {
        id: {
          name: 'id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
        post_id: {
          name: 'post_id',
          type: 'integer',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
        content: {
          name: 'content',
          type: 'text',
          default: null,
          check: null,
          comment: null,
          primary: false,
          unique: false,
          notNull: false,
        },
      },
      comment: null,
      constraints: {},
      indexes: {},
    },
  },
  relationships: {
    rel1: {
      name: 'rel1',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'user_id',
      cardinality: 'ONE_TO_MANY' as const,
      updateConstraint: 'NO_ACTION' as const,
      deleteConstraint: 'NO_ACTION' as const,
    },
  },
  tableGroups: {
    group1: {
      name: 'group1',
      tables: ['users', 'posts'],
      comment: null,
    },
  },
}

/**
 * Helper function to handle keyboard events for the MentionSuggestor
 * Only passes navigation keys to the MentionSuggestor when suggestions are visible
 */
const handleSuggestionKeyDown = (
  e: KeyboardEvent<HTMLTextAreaElement>,
  input: string,
  cursorPos: number,
  trigger = '@',
) => {
  const regex = new RegExp(`\\${trigger}[\\w-]*$`)

  // Only handle special keys when suggestions are visible
  if (regex.test(input.slice(0, cursorPos))) {
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'Enter' ||
      e.key === 'Tab' ||
      e.key === 'Escape'
    ) {
      // Prevent default textarea behavior
      e.preventDefault()

      // Forward the event to the MentionSuggestor
      const suggestorElement = document.querySelector(
        '[aria-label="Mention suggestions"]',
      )

      if (suggestorElement) {
        const keyboardEvent = new KeyboardEvent('keydown', {
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          bubbles: true,
        })
        suggestorElement.dispatchEvent(keyboardEvent)
      }
    }
  }
}

/**
 * Basic schema mention example
 */
export const SchemaMention = {
  render: () => {
    const [input, setInput] = useState('Type @ to mention schema...')
    const [cursorPos, setcursorPos] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    return (
      <div style={{ width: 400, margin: 32 }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setcursorPos(e.target.selectionStart)
          }}
          onClick={(e) =>
            setcursorPos((e.target as HTMLTextAreaElement).selectionStart)
          }
          onKeyDown={(e) => {
            setcursorPos((e.target as HTMLTextAreaElement).selectionStart)
            handleSuggestionKeyDown(e, input, cursorPos)
          }}
          rows={3}
          style={{ width: '100%', fontSize: 16, marginBottom: 8 }}
        />
        <MentionSuggestor
          id="mention-suggestor"
          input={input}
          cursorPos={cursorPos}
          enabled={/@[\w-]*$/.test(input.slice(0, cursorPos))}
          onSelect={(item) => {
            setSelected(item.label)
            textareaRef.current?.focus()
          }}
        />
        {selected && <div>Selected: {selected}</div>}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic schema mention example with table, column, and relation suggestions.',
      },
    },
  },
}

/**
 * Example demonstrating item limiting and empty state
 */
export const LimitedItems = {
  render: () => {
    const [input, setInput] = useState('Type @ to filter...')
    const [cursorPos, setcursorPos] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    return (
      <div style={{ width: 400, margin: 32 }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setcursorPos(e.target.selectionStart)
          }}
          onClick={(e) =>
            setcursorPos((e.target as HTMLTextAreaElement).selectionStart)
          }
          onKeyDown={(e) => {
            setcursorPos((e.target as HTMLTextAreaElement).selectionStart)
            handleSuggestionKeyDown(e, input, cursorPos)
          }}
          rows={3}
          style={{ width: '100%', fontSize: 16, marginBottom: 8 }}
        />
        <MentionSuggestor
          id="mention-suggestor"
          input={input}
          cursorPos={cursorPos}
          enabled={/@[\w-]*$/.test(input.slice(0, cursorPos))}
          maxMatches={2}
          onSelect={(item) => {
            setSelected(item.label)
            textareaRef.current?.focus()
          }}
        />
        {selected && <div>Selected: {selected}</div>}
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
          Try typing a string that matches no candidates (e.g. "zzzz") to see
          the empty state.
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates maxItems=3 limit (showing only first 3 matches) and custom empty state message when no matches are found.',
      },
    },
  },
}
