import { createClient } from '@/libs/db/server'
import type { ReactNode } from 'react'
import { ClientAppBar } from './ClientAppBar'
import styles from './CommonLayout.module.css'
import { GlobalNav } from './GlobalNav'

type CommonLayoutProps = {
  children: ReactNode
}

export async function CommonLayout({ children }: CommonLayoutProps) {
  // In a Server Component, we can't directly access the URL path
  // We'll let the ClientAppBar handle path detection and project ID extraction

  // Get the current user
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  // Get the user's name from the users table
  let avatarInitial = 'L' // Default initial
  if (userData?.user?.id) {
    const { data: userDetails } = await supabase
      .from('users')
      .select('name')
      .eq('id', userData.user.id)
      .single()

    // Extract the first initial from the user's name
    if (userDetails?.name) {
      avatarInitial = userDetails.name.charAt(0).toUpperCase()
    }
  }

  return (
    <div className={styles.layout}>
      <GlobalNav />
      <div className={styles.mainContent}>
        <ClientAppBar
          avatarInitial={avatarInitial}
          avatarColor="var(--color-teal-800)"
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
