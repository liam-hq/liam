import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'

const meta = {
  component: DeleteConfirmationModal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    organizationName: {
      control: 'text',
      description: 'Name of the organization to delete',
    },
    confirmText: {
      control: 'text',
      description: 'Current value of confirmation text input',
    },
    isConfirmEnabled: {
      control: 'boolean',
      description: 'Whether the confirm button is enabled',
    },
    isPending: {
      control: 'boolean',
      description: 'Whether the deletion is in progress',
    },
    onClose: {
      action: 'close',
      description: 'Callback when modal is closed',
    },
    onConfirmTextChange: {
      action: 'confirm text changed',
      description: 'Callback when confirmation text changes',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback when deletion is confirmed',
    },
  },
} satisfies Meta<typeof DeleteConfirmationModal>

export default meta
type Story = StoryObj<typeof DeleteConfirmationModal>

export const Default: Story = {
  args: {
    isOpen: true,
    organizationName: 'Acme Corporation',
    confirmText: '',
    isConfirmEnabled: false,
    isPending: false,
  },
}

export const WithConfirmationText: Story = {
  args: {
    isOpen: true,
    organizationName: 'Acme Corporation',
    confirmText: 'Acme Corporation',
    isConfirmEnabled: true,
    isPending: false,
  },
}

export const Loading: Story = {
  args: {
    isOpen: true,
    organizationName: 'Acme Corporation',
    confirmText: 'Acme Corporation',
    isConfirmEnabled: true,
    isPending: true,
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [confirmText, setConfirmText] = useState('')
    const organizationName = 'Acme Corporation'
    const isConfirmEnabled = confirmText === organizationName

    return (
      <DeleteConfirmationModal
        {...args}
        isOpen={true}
        organizationName={organizationName}
        confirmText={confirmText}
        onConfirmTextChange={setConfirmText}
        isConfirmEnabled={isConfirmEnabled}
      />
    )
  },
}
