import type { Meta, StoryObj } from '@storybook/react'
import { Code } from './Code'

const meta = {
  component: Code,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary'],
      description: 'The color variant of the code badge',
    },
    style: {
      control: 'select',
      options: ['outline', 'fill'],
      description: 'The visual style of the code badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the code badge',
    },
    children: {
      control: 'text',
      description: 'The text content to display',
    },
  },
} satisfies Meta<typeof Code>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'main',
    variant: 'default',
    size: 'md',
  },
}

export const Primary: Story = {
  args: {
    children: 'production',
    variant: 'primary',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    children: 'feature/new',
    variant: 'default',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'develop',
    variant: 'default',
    size: 'lg',
  },
}

export const AllVariants: Story = {
  args: {
    children: 'example',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ margin: '0 0 16px 0', color: '#999' }}>Outline Style</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Code variant="default" style="outline" size="sm">
              main
            </Code>
            <Code variant="default" style="outline" size="md">
              main
            </Code>
            <Code variant="default" style="outline" size="lg">
              main
            </Code>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Code variant="primary" style="outline" size="sm">
              main
            </Code>
            <Code variant="primary" style="outline" size="md">
              main
            </Code>
            <Code variant="primary" style="outline" size="lg">
              main
            </Code>
          </div>
        </div>
      </div>
      <div>
        <h3 style={{ margin: '0 0 16px 0', color: '#999' }}>Fill Style</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Code variant="default" style="fill" size="sm">
              main
            </Code>
            <Code variant="default" style="fill" size="md">
              main
            </Code>
            <Code variant="default" style="fill" size="lg">
              main
            </Code>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Code variant="primary" style="fill" size="sm">
              main
            </Code>
            <Code variant="primary" style="fill" size="md">
              main
            </Code>
            <Code variant="primary" style="fill" size="lg">
              main
            </Code>
          </div>
        </div>
      </div>
    </div>
  ),
}
