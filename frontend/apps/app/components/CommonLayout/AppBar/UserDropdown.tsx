'use client'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import {
  Avatar,
  AvatarWithImage,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  LogOut,
  useToast,
} from '@liam-hq/ui'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'

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

export const UserDropdown: FC<Props> = ({ avatarUrl, userName, userEmail }) => {
  const toast = useToast()
  const router = useRouter()

  const userInitial = getUserInitial({ userName, userEmail })

  const handleLogout = useCallback(async () => {
    const result = await fromAsyncThrowable(async () =>
      fetch('/api/logout', { method: 'POST', cache: 'no-store' }),
    )()

    if (result.isOk() && result.value.ok) {
      router.push('/login?logout=success')
      return
    }

    // If fetch failed or response not OK, show error
    toast({
      title: 'Logout failed',
      description: 'Unable to complete logout. Please try again.',
      status: 'error',
    })
  }, [toast, router])

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        {avatarUrl ? (
          <AvatarWithImage
            src={avatarUrl}
            alt=""
            size="sm"
            aria-label={`${userName || userEmail || 'User'} profile`}
          />
        ) : (
          <Avatar
            initial={userInitial}
            size="sm"
            user="you"
            aria-label={`${userName || userEmail || 'User'} profile`}
          />
        )}
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
