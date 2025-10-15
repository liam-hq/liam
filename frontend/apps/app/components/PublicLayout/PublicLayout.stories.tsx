import type { Meta, StoryObj } from '@storybook/nextjs'
import { PublicLayout } from './PublicLayout'

const meta = {
  component: PublicLayout,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Sample Content</h1>
        <p>
          This is sample content to demonstrate the PublicLayout component
          structure.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof PublicLayout>

export default meta
type Story = StoryObj<typeof PublicLayout>

export const Default: Story = {}

export const WithLongContent: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Long Content Example</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>
    ),
  },
}
