'use client'

import { useToast } from '@liam-hq/ui'
import { useEffect } from 'react'

export function OrganizationsPageClient() {
  const toast = useToast()

  useEffect(() => {
    // Check for stored toast notification data
    const storedToast = sessionStorage.getItem('organization_deleted')
    if (storedToast) {
      const toastData = JSON.parse(storedToast)
      toast({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        title: toastData.title,

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        description: toastData.description,

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        status: toastData.status,
      })
      // Remove the stored data after displaying
      sessionStorage.removeItem('organization_deleted')
    }
  }, [toast])

  return null // This component doesn't render anything
}
