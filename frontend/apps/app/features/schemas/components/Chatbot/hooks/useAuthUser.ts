'use client'

import { createClient } from '@/libs/db/client'
import { useEffect, useState } from 'react'

type AuthUserData = {
  avatarUrl: string | null
  userId: string | null
  loading: boolean
}

export const useAuthUser = () => {
  const [userData, setUserData] = useState<AuthUserData>({
    avatarUrl: null,
    userId: null,
    loading: true,
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          setUserData({
            avatarUrl: null,
            userId: null,
            loading: false,
          })
          return
        }

        setUserData({
          avatarUrl: data.user.user_metadata?.avatar_url || null,
          userId: data.user.id,
          loading: false,
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        setUserData({
          avatarUrl: null,
          userId: null,
          loading: false,
        })
      }
    }

    fetchUser()
  }, [])

  return userData
}
