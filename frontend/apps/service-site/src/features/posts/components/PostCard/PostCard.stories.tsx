import type { Meta, StoryObj } from '@storybook/react'

import { aPost } from '../../factories'
import { PostCard } from './'

const meta = {
  component: PostCard,
  args: {
    post: aPost(),
  },
} satisfies Meta<typeof PostCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
