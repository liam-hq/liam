import { aBuildingSchemaVersion } from '@liam-hq/db'
import { aSchema } from '@liam-hq/schema'
import type { Meta, StoryObj } from '@storybook/react'
import { HttpResponse, http } from 'msw'
import { aTypicalConversation } from '../../factories'
import { AnimatedChatDemo } from './AnimatedChatDemo'
import { Chat } from './Chat'

const ITEMS = aTypicalConversation()

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
    designSessionId: 'design-session-id',
  },
} satisfies Meta<typeof Chat>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    schemaData: aSchema(),
    designSessionId: 'design-session-id',
    timelineItems: ITEMS,
    onMessageSend: () => {},
    onVersionView: () => {},
    onArtifactLinkClick: () => {},
    isDeepModelingEnabled: false,
  },
}

export const AnimatedDemo: Story = {
  args: {
    schemaData: aSchema(),
    designSessionId: 'design-session-id',
    timelineItems: ITEMS,
    onMessageSend: () => {},
    onVersionView: () => {},
    onArtifactLinkClick: () => {},
    isDeepModelingEnabled: false,
  },
  render: (props) => <AnimatedChatDemo {...props} />,
}
