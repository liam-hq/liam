import type { Meta, StoryObj } from '@storybook/nextjs'
import { GeneralPageView } from './GeneralPageView'

const meta = {
  component: GeneralPageView,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    organization: {
      description: 'Organization details',
    },
  },
} satisfies Meta<typeof GeneralPageView>

export default meta
type Story = StoryObj<typeof GeneralPageView>

export const Default: Story = {
  name: 'Default',
  args: {
    organization: {
      id: 'org-123',
      name: 'Sample Organization',
    },
  },
}

export const LongName: Story = {
  name: 'Long organization name',
  args: {
    organization: {
      id: 'org-456',
      name: 'Very Long Organization Name That Might Wrap to Multiple Lines',
    },
  },
}
