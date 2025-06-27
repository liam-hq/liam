'use client'

import { useToast } from '@liam-hq/ui'
import { useEffect } from 'react'

interface ToastData {
  title: string
  description: string
  status: 'success' | 'error' | 'warning' | 'info'
}

function isValidToastData(data: unknown): data is ToastData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    'description' in data &&
    'status' in data &&
    typeof (data as ToastData).title === 'string' &&
    typeof (data as ToastData).description === 'string' &&
    ['success', 'error', 'warning', 'info'].includes((data as ToastData).status)
  )
}

export function OrganizationsPageClient() {
  const toast = useToast()

  useEffect(() => {
    // Check for stored toast notification data
    const storedToast = sessionStorage.getItem('organization_deleted')
    if (storedToast) {
      try {
        const toastData = JSON.parse(storedToast)
        if (isValidToastData(toastData)) {
          toast({
            title: toastData.title,
            description: toastData.description,
            status: toastData.status,
          })
        }
      } catch {
        // Ignore invalid JSON
      }
      // Remove the stored data after displaying
      sessionStorage.removeItem('organization_deleted')
    }
  }, [toast])

  return null // This component doesn't render anything
}
