import type { Meta, StoryObj } from '@storybook/react'

import { PrivacyPage } from './'

const meta = {
  component: PrivacyPage,
} satisfies Meta<typeof PrivacyPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
