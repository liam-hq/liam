import type { Meta, StoryObj } from '@storybook/nextjs'
import { PublicAppBar } from './PublicAppBar'

const meta = {
  component: PublicAppBar,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PublicAppBar>

export default meta
type Story = StoryObj<typeof PublicAppBar>

export const Default: Story = {}
