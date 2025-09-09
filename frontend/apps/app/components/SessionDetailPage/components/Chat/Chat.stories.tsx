import type { BaseMessage } from '@langchain/core/messages'
import { aBuildingSchemaVersion } from '@liam-hq/db'
import { aSchema } from '@liam-hq/schema'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { HttpResponse, http } from 'msw'
import { AnimatedChatDemo } from './AnimatedChatDemo'
import { Chat } from './Chat'
import { aMessage } from './factories'

// Sample messages for testing
const MESSAGES: BaseMessage[] = [
  aMessage('human', {
    content: 'Create a database for managing a library system',
  }),
  aMessage('ai', {
    content:
      "I'll help you design a database for a library management system. Let me analyze the requirements.",
  }),
  aMessage('tool', {
    content:
      'Requirements analyzed: Need tables for books, members, loans, and categories',
  }),
  aMessage('ai', {
    content: [
      {
        type: 'text',
        text: 'Based on the analysis, here is the proposed schema:',
      },
      {
        type: 'text',
        text: '\n\n```sql\nCREATE TABLE books (\n  id SERIAL PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  isbn VARCHAR(13) UNIQUE\n);\n```',
      },
    ],
  }),
  aMessage('human', {
    content: [
      {
        type: 'text',
        text: 'Can you add an author table as well?',
      },
      {
        type: 'image_url',
        image_url: {
          url: 'https://example.com/schema-diagram.png',
          detail: 'high',
        },
      },
    ],
  }),
  aMessage('system', {
    content: 'Session saved successfully',
  }),
]

const meta = {
  component: Chat,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        http.get(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/building_schema_versions`,
          () => {
            return HttpResponse.json({
              ...aBuildingSchemaVersion(),
            })
          },
        ),
      ],
    },
  },
  args: {
    schemaData: aSchema(),
  },
} satisfies Meta<typeof Chat>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    schemaData: aSchema(),
    messages: MESSAGES,
    onMessageSend: () => {},
  },
}

export const AnimatedDemo: Story = {
  args: {
    schemaData: aSchema(),
    messages: MESSAGES,
    onMessageSend: () => {},
  },
  render: (props) => <AnimatedChatDemo {...props} />,
}

export const WithComplexMessages: Story = {
  args: {
    schemaData: aSchema(),
    messages: [
      aMessage('human', {
        content: 'Design a database for an e-commerce platform',
      }),
      aMessage('ai', {
        content: [
          {
            type: 'text',
            text: "I'll design a comprehensive e-commerce database. Here's the structure:",
          },
        ],
      }),
      aMessage('tool', {
        content: 'Schema created successfully with 4 tables and relationships',
      }),
      aMessage('ai', {
        content:
          'The database design is complete. Would you like me to add payment processing tables?',
      }),
    ],
    onMessageSend: () => {},
  },
}
