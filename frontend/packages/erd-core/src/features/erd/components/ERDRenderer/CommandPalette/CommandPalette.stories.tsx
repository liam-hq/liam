import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from '@storybook/test'
import type { ComponentProps } from 'react'
import { CommandPalette } from './CommandPalette'

// Define the component props type
type CommandPaletteProps = ComponentProps<typeof CommandPalette>

const meta = {
  title: 'erd-core/ERDRender/CommandPalette',
  component: CommandPalette,
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const bodyElement = canvasElement.parentElement?.parentElement
    if (!bodyElement) return

    const body = within(bodyElement)

    await userEvent.keyboard('{Meta>}k{/Meta}')

    await body.findByRole('dialog', { name: 'Command Palette' })
  },
} satisfies Meta<typeof CommandPalette>

export default meta
type Story = StoryObj<CommandPaletteProps>

export const Default: Story = {}
