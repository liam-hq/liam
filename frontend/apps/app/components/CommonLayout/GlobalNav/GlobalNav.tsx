'use client'

import { urlgen } from '@/libs/routes'
import { LiamLogoMark, LiamMigrationLogo } from '@/logos'
import { LayoutGrid } from '@liam-hq/ui/src/icons'
import clsx from 'clsx'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import type { Organization } from '../services/getOrganization'
import type { OrganizationsByUserId } from '../services/getOrganizationsByUserId'
import styles from './GlobalNav.module.css'
import itemStyles from './Item.module.css'
import { LinkItem, type LinkItemProps } from './LinkItem'
import { OrganizationItem } from './OrganizationItem'

const items: LinkItemProps[] = [
  {
    icon: <LayoutGrid />,
    label: 'Projects',
    href: urlgen('projects'),
  },
]

type Props = {
  currentOrganization: Organization | null
  organizations: OrganizationsByUserId | null
}

export const GlobalNav: FC<Props> = ({
  currentOrganization,
  organizations,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false)

  const navRef = useRef<HTMLDivElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY }
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const isMouseOverNav = useCallback((): boolean => {
    if (!navRef.current) return false

    const { x, y } = mousePositionRef.current

    if (!Number.isFinite(x) || !Number.isFinite(y)) return false

    const elementAtPoint = document.elementFromPoint(x, y)
    return elementAtPoint !== null && navRef.current.contains(elementAtPoint)
  }, [])

  const handleNavMouseEnter = () => {
    setIsExpanded(true)
  }

  const handleNavMouseLeave = () => {
    // NOTE: Keep isExpanded as true when the OrganizationItem menu is open
    if (!organizationMenuOpen) {
      setIsExpanded(false)
    }
  }

  const handleOrganizationMenuOpenChange = useCallback(
    (open: boolean) => {
      setOrganizationMenuOpen(open)

      if (open) {
        // NOTE: Force isExpanded to true when the menu is opened
        setIsExpanded(true)
      } else {
        // NOTE: When the menu is closed, set isExpanded to false only if the mouse is not over the navigation
        if (!isMouseOverNav()) {
          setIsExpanded(false)
        }
      }
    },
    [isMouseOverNav],
  )

  return (
    <div className={styles.globalNavContainer}>
      <nav
        ref={navRef}
        className={clsx(
          styles.globalNav,
          isExpanded && styles.globalNavExpanded,
        )}
        onMouseEnter={handleNavMouseEnter}
        onMouseLeave={handleNavMouseLeave}
      >
        <div className={styles.logoContainer}>
          <div className={styles.logoSection}>
            <div className={itemStyles.iconContainer}>
              <LiamLogoMark />
            </div>
            <div
              className={clsx(
                itemStyles.labelArea,
                isExpanded && itemStyles.expandLabelArea,
              )}
            >
              <LiamMigrationLogo className={styles.liamMigrationLogo} />
            </div>
          </div>
        </div>

        <div className={styles.navSection}>
          {currentOrganization && (
            <OrganizationItem
              isExpanded={isExpanded}
              currentOrganization={currentOrganization}
              organizations={organizations ?? []}
              open={organizationMenuOpen}
              onOpenChange={handleOrganizationMenuOpenChange}
            />
          )}

          {items.map((item) => (
            <LinkItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isExpanded={isExpanded}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}
