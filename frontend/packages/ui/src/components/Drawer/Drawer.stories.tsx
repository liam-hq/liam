import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../Button'
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer'

const DrawerExample = () => {
  return (
    <DrawerRoot>
      <DrawerTrigger asChild>
        <Button>Open Drawer</Button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerContent>
          <div style={{ padding: '24px' }}>
            <DrawerTitle>Drawer Title</DrawerTitle>
            <DrawerDescription>
              This is a drawer component built with Vaul. You can add any
              content here.
            </DrawerDescription>
            <div style={{ marginTop: '16px' }}>
              <DrawerClose asChild>
                <Button>Close</Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  )
}

const meta = {
  component: DrawerRoot,
  parameters: {
    docs: {
      description: {
        component:
          'A Vaul Drawer wrapper. Use DrawerRoot, DrawerTrigger, DrawerPortal, DrawerContent, DrawerTitle, DrawerDescription, and DrawerClose together.',
      },
    },
  },
} satisfies Meta<typeof DrawerRoot>

export default meta
type Story = StoryObj<typeof DrawerRoot>

export const Default: Story = {
  render: () => <DrawerExample />,
}
