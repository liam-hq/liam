import type { Meta, StoryObj } from '@storybook/nextjs'
import { PublicGlobalNav } from './PublicGlobalNav'

const meta = {
  component: PublicGlobalNav,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PublicGlobalNav>

export default meta
type Story = StoryObj<typeof PublicGlobalNav>

export const Default: Story = {}
