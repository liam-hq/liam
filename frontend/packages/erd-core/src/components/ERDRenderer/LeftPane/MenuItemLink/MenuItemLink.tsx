import { SidebarMenuButton, SidebarMenuItem } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import styles from './MenuItemLink.module.css'

export type Props = {
  label: string
  href: string
  isExternalLink?: boolean
  icon: ReactNode
}

export const MenuItemLink: FC<Props> = ({
  label,
  href,
  isExternalLink,
  icon,
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a
          className={styles.link}
          href={href}
          target={isExternalLink ? '_blank' : '_self'}
          rel={'noreferrer'}
        >
          {icon}
          <span className={styles.label}>{label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
