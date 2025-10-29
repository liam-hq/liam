import type { Meta, StoryObj } from '@storybook/nextjs'
import { HeaderActions } from './HeaderActions'

const meta = {
  component: HeaderActions,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '800px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onInstallApp: {
      action: 'clicked',
      description: 'Callback when install button is clicked',
    },
    installButtonDisabled: {
      control: 'boolean',
      description: 'Whether the install button is disabled',
    },
  },
} satisfies Meta<typeof HeaderActions>

export default meta
type Story = StoryObj<typeof HeaderActions>

const MockInstallationDropdown = () => (
  <div
    style={{
      padding: '8px 12px',
      border: '1px solid var(--color-border)',
      borderRadius: '4px',
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      minWidth: '200px',
    }}
  >
    Installation Dropdown
  </div>
)

export const Default: Story = {
  args: {
    installationDropdown: <MockInstallationDropdown />,
    installButtonDisabled: false,
  },
}

export const Disabled: Story = {
  args: {
    installationDropdown: <MockInstallationDropdown />,
    installButtonDisabled: true,
  },
}
