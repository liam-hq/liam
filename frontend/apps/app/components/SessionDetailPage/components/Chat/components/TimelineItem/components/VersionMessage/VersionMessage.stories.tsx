import { aBuildingSchemaVersion } from '@liam-hq/db'
import type { Meta, StoryObj } from '@storybook/react'
import { HttpResponse, http } from 'msw'
import { VersionMessage } from './VersionMessage'

const meta = {
  component: VersionMessage,
  parameters: {
    layout: 'centered',
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
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VersionMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    buildingSchemaVersionId: 'test-id',
    onView: () => {},
  },
}
