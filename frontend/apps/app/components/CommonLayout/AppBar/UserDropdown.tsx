'use client'

import { LogOut, useToast } from '@liam-hq/ui'
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

type Props = {
  avatarUrl: string
}

// Helper function to delete cookie
const deleteCookie = (name: string) => {
  const expires = 'Thu, 01 Jan 1970 00:00:00 UTC'
  const cookie = `${name}=; expires=${expires}; path=/;`
  // biome-ignore lint/suspicious/noDocumentCookie: Required for cookie deletion
  document.cookie = cookie
}

export const UserDropdown: FC<Props> = ({ avatarUrl }) => {
  const toast = useToast()
  const router = useRouter()

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
        <AvatarWithImage src={avatarUrl} alt="User profile" size="sm" />
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
