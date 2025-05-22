import type { Meta } from '@storybook/react'
import type { KeyboardEvent } from 'react'
import { useRef, useState } from 'react'
import { type MentionCandidate, MentionSuggestor } from './MentionSuggestor'

const meta: Meta<typeof MentionSuggestor> = {
  title: 'Components/Chat/MentionSuggestor',
  component: MentionSuggestor,
}
export default meta

/**
 * Sample schema candidates for demonstration
 */
const schemaCandidates: MentionCandidate[] = [
  {
    id: 'group1',
    label: 'UserGroup',
    type: 'group',
  },
  {
    id: 'users',
    label: 'users',
    type: 'table',
  },
  {
    id: 'user_id',
    label: 'users.id',
    type: 'column',
    columnType: 'primary',
  },
  { id: 'posts', label: 'posts', type: 'table' },
  {
    id: 'post_id',
    label: 'posts.id',
    type: 'column',
    columnType: 'primary',
  },
  {
    id: 'rel1',
    label: 'user_posts',
    type: 'relation',
  },
]

/**
 * Extended candidates for testing pagination and filtering
 */
const extendedCandidates: MentionCandidate[] = [
  ...schemaCandidates,
  {
    id: 'comments',
    label: 'comments',
    type: 'table',
    description: 'Comments table',
  },
  {
    id: 'comment_id',
    label: 'comments.id',
    type: 'column',
    description: 'Comment ID',
    columnType: 'primary',
  },
]

/**
 * Helper function to handle keyboard events for the MentionSuggestor
 * Only passes navigation keys to the MentionSuggestor when suggestions are visible
 */
const handleSuggestionKeyDown = (
  e: KeyboardEvent<HTMLTextAreaElement>,
  input: string,
  caret: number,
  trigger = '@',
) => {
  const regex = new RegExp(`\\${trigger}[\\w-]*$`)

  // Only handle special keys when suggestions are visible
  if (regex.test(input.slice(0, caret))) {
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
    const [caret, setCaret] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    return (
      <div style={{ width: 400, margin: 32 }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setCaret(e.target.selectionStart)
          }}
          onClick={(e) =>
            setCaret((e.target as HTMLTextAreaElement).selectionStart)
          }
          onKeyDown={(e) => {
            setCaret((e.target as HTMLTextAreaElement).selectionStart)
            handleSuggestionKeyDown(e, input, caret)
          }}
          rows={3}
          style={{ width: '100%', fontSize: 16, marginBottom: 8 }}
        />
        <MentionSuggestor
          trigger="@"
          input={input}
          caret={caret}
          candidates={schemaCandidates}
          visible={/@[\w-]*$/.test(input.slice(0, caret))}
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
    const [caret, setCaret] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    return (
      <div style={{ width: 400, margin: 32 }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setCaret(e.target.selectionStart)
          }}
          onClick={(e) =>
            setCaret((e.target as HTMLTextAreaElement).selectionStart)
          }
          onKeyDown={(e) => {
            setCaret((e.target as HTMLTextAreaElement).selectionStart)
            handleSuggestionKeyDown(e, input, caret)
          }}
          rows={3}
          style={{ width: '100%', fontSize: 16, marginBottom: 8 }}
        />
        <MentionSuggestor
          trigger="@"
          input={input}
          caret={caret}
          candidates={extendedCandidates}
          visible={/@[\w-]*$/.test(input.slice(0, caret))}
          maxItems={3}
          noItemsMessage="No results found"
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
