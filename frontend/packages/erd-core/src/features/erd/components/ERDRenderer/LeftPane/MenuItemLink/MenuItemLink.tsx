import { SidebarMenuButton, SidebarMenuItem } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import styles from './MenuItemLink.module.css'

export type Props = {
  label: string
  href: string
  target: '_self' | '_blank'
  noreferrer: boolean
  icon: ReactNode
}

export const MenuItemLink: FC<Props> = ({
  label,
  href,
  target,
  noreferrer,
  icon,
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a
          className={styles.link}
          href={href}
          target={target}
          rel={noreferrer ? 'noreferrer' : undefined}
        >
          {icon}
          <span className={styles.label}>{label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
