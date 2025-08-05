'use client'

import { type FC, useCallback } from 'react'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from '@/components'
import { ArrowRight } from '@/icons'
import { logout } from '../actions/logout'
import styles from './UserMenu.module.css'

export const Content: FC = () => {
  const handleLogout = useCallback(async () => {
    await logout()
  }, [])

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="end"
        sideOffset={5}
        className={styles.content}
      >
        <DropdownMenuItem leftIcon={<ArrowRight />} onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
