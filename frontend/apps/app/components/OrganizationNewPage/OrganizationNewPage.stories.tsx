import type { Meta, StoryObj } from '@storybook/nextjs'
import { OrganizationNewPage } from './OrganizationNewPage'

const meta = {
  component: OrganizationNewPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof OrganizationNewPage>

export default meta
type Story = StoryObj<typeof OrganizationNewPage>

export const Default: Story = {
  name: 'Default',
}
