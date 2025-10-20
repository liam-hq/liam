import type { Meta, StoryObj } from '@storybook/nextjs'
import { NewSessionButton } from './NewSessionButton'

const meta = {
  component: NewSessionButton,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
} satisfies Meta<typeof NewSessionButton>

export default meta
type Story = StoryObj<typeof NewSessionButton>

export const Default: Story = {}
