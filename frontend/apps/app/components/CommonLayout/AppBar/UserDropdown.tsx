'use client'

import { Avatar, LogOut, useToast } from '@liam-hq/ui'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import {
  AvatarWithImage,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components'
import { createClient } from '@/libs/db/client'
import styles from './UserDropdown.module.css'

function getUserInitial({
  userName,
  userEmail,
}: {
  userName?: string
  userEmail?: string | null
}) {
  const fromName = userName
    ?.split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  if (fromName) return fromName
  const fromEmail = userEmail?.trim()?.[0]?.toUpperCase()
  return fromEmail || 'U'
}

type Props = {
  avatarUrl?: string | null
  userName?: string
  userEmail?: string | null
}

// Helper function to delete cookie
const deleteCookie = (name: string) => {
  const expires = 'Thu, 01 Jan 1970 00:00:00 UTC'
  const cookie = `${name}=; expires=${expires}; path=/;`
  // biome-ignore lint/suspicious/noDocumentCookie: Required for cookie deletion
  document.cookie = cookie
}

export const UserDropdown: FC<Props> = ({ avatarUrl, userName, userEmail }) => {
  const toast = useToast()
  const router = useRouter()

  const userInitial = getUserInitial({ userName, userEmail })

  const handleLogout = useCallback(async () => {
    // Perform logout on client side
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (!error) {
      // Delete organizationId cookie
      deleteCookie('organizationId')

      // Redirect with success parameter
      router.push('/app/login?logout=success')
    } else {
      toast({
        title: 'Logout failed',
        description: error.message || 'An error occurred during logout.',
        status: 'error',
      })
    }
  }, [toast, router])

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className={styles.triggerButton}
        >
          {avatarUrl ? (
            <AvatarWithImage src={avatarUrl} alt="" size="sm" />
          ) : (
            <Avatar
              initial={userInitial}
              size="sm"
              user="you"
              aria-label={`${userName || userEmail || 'User'} profile`}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={5}>
          <DropdownMenuItem leftIcon={<LogOut />} onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
