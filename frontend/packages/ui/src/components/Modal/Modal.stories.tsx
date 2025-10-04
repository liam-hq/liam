import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../Button'
import {
  ModalActions,
  ModalClose,
  ModalConfirm,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from './Modal'

const ModalExample = () => {
  return (
    <ModalRoot>
      <ModalTrigger asChild>
        <Button>Open Modal</Button>
      </ModalTrigger>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent>
          <ModalTitle>Modal Title</ModalTitle>
          <ModalDescription>
            This is a modal dialog built with Radix UI. You can add any content
            here.
          </ModalDescription>
          <ModalActions>
            <ModalClose>
              <Button variant="outline-secondary">Cancel</Button>
            </ModalClose>
            <ModalConfirm>
              <Button variant="solid-primary">Confirm</Button>
            </ModalConfirm>
          </ModalActions>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}

const meta = {
  component: ModalRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A Radix UI Dialog wrapper. Use ModalRoot, ModalTrigger, ModalPortal, ModalOverlay, ModalContent, ModalTitle, ModalDescription, ModalActions, ModalClose, and ModalConfirm together.',
      },
    },
  },
} satisfies Meta<typeof ModalRoot>

export default meta
type Story = StoryObj<typeof ModalRoot>

export const Default: Story = {
  render: () => <ModalExample />,
}
