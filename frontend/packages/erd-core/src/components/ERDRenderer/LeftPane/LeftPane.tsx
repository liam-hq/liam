import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@liam-hq/ui'
import { useDBStructureStore } from '../../../stores'

export const LeftPane = () => {
  const { tables } = useDBStructureStore()
  const count = Object.keys(tables).length

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tables</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.values(tables).map((table) => (
                <SidebarMenuItem key={table.name}>
                  <SidebarMenuButton>{table.name}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {count} / {count}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
