import { useVersion } from '@/providers'
import {
  BookText,
  GithubLogo,
  LiamLogoMark,
  Megaphone,
  MessagesSquare,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@liam-hq/ui'
import { useNodes } from '@xyflow/react'
import { useMemo } from 'react'
import { isTableNode } from '../ERDContent'
import { CopyLinkButton } from './CopyLinkButton'
import styles from './LeftPane.module.css'
import { MenuItemLink, type Props as MenuItemLinkProps } from './MenuItemLink'
import { TableCounter } from './TableCounter'
import { TableNameMenuButton } from './TableNameMenuButton'

const menuItemLinks: MenuItemLinkProps[] = [
  {
    label: 'Release Notes',
    href: 'https://github.com/liam-hq/liam/releases',
    isExternalLink: true,
    icon: <Megaphone className={styles.icon} />,
  },
  {
    label: 'Documentation',
    href: 'https://liambx.com/docs',
    isExternalLink: true,
    icon: <BookText className={styles.icon} />,
  },
  {
    label: 'Community Forum',
    href: 'https://github.com/liam-hq/liam/discussions',
    isExternalLink: true,
    icon: <MessagesSquare className={styles.icon} />,
  },
  {
    label: 'Go to Homepage',
    href: 'https://liambx.com/',
    isExternalLink: true,
    icon: <LiamLogoMark className={styles.icon} />,
  },
  {
    label: 'Go to GitHub',
    href: 'https://github.com/liam-hq/liam',
    isExternalLink: true,
    icon: <GithubLogo className={styles.icon} />,
  },
]

export const LeftPane = () => {
  const { version } = useVersion()

  const nodes = useNodes()
  const tableNodes = useMemo(() => {
    return nodes.filter(isTableNode).sort((a, b) => {
      const nameA = a.data.table.name
      const nameB = b.data.table.name
      if (nameA < nameB) {
        return -1
      }
      if (nameA > nameB) {
        return 1
      }
      return 0
    })
  }, [nodes])

  const allCount = tableNodes.length
  const visibleCount = tableNodes.filter((node) => !node.hidden).length

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={styles.groupLabel} asChild>
            <span>Tables</span>
            <span className={styles.tableCount}>
              {visibleCount}
              <span className={styles.tableCountDivider}>/</span>
              {allCount}
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tableNodes.map((node) => (
                <TableNameMenuButton key={node.id} node={node} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={styles.footer}>
        <div className={styles.tableCounterWrapper}>
          <TableCounter allCount={allCount} visibleCount={visibleCount} />
        </div>
        <SidebarMenu className={styles.footerControls}>
          <CopyLinkButton />
        </SidebarMenu>
        <SidebarMenu className={styles.footerLinks}>
          {menuItemLinks.map((item) => (
            <MenuItemLink {...item} key={item.label} />
          ))}
          <SidebarMenuItem className={styles.versionWrapper}>
            <div className={styles.version}>
              <span
                className={styles.versionText}
              >{`${version.version} + ${version.gitHash.slice(0, 7)} (${version.date})`}</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
