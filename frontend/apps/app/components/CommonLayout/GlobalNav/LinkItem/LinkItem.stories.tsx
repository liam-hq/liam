import { Building, FileText, Settings } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { LinkItem } from './LinkItem'

const meta = {
  component: LinkItem,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '250px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    href: {
      control: 'text',
      description: 'URL to navigate to',
    },
    icon: {
      description: 'Icon to display',
    },
    label: {
      control: 'text',
      description: 'Label text for the link',
    },
  },
} satisfies Meta<typeof LinkItem>

export default meta
type Story = StoryObj<typeof LinkItem>

export const ProjectsLink: Story = {
  args: {
    href: '/projects',
    icon: <Building size={20} />,
    label: 'Projects',
  },
}

export const SettingsLink: Story = {
  args: {
    href: '/settings',
    icon: <Settings size={20} />,
    label: 'Settings',
  },
}

export const DocumentationLink: Story = {
  args: {
    href: '/docs',
    icon: <FileText size={20} />,
    label: 'Documentation',
  },
}
