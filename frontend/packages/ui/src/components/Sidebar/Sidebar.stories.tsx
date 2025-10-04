import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './Sidebar'

const SidebarExample = () => {
  const [open, setOpen] = useState(true)

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={{ height: '500px' }}
    >
      <Sidebar>
        <SidebarHeader>
          <div style={{ padding: '16px' }}>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Projects</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Settings</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div style={{ padding: '16px' }}>Footer Content</div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}

const meta = {
  component: SidebarProvider,
  parameters: {
    docs: {
      description: {
        component:
          'A comprehensive sidebar component with collapsible functionality. Use SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, and menu components together.',
      },
    },
  },
} satisfies Meta<typeof SidebarProvider>

export default meta
type Story = StoryObj<typeof SidebarProvider>

export const Default: Story = {
  render: () => <SidebarExample />,
}
