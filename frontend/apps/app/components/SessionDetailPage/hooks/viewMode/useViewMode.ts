'use client'

import { useContext } from 'react'
import { ViewModeContext } from '../../contexts/ViewModeContext'

export const useViewMode = () => {
  const context = useContext(ViewModeContext)

  if (!context) {
    return {
      mode: 'private' as const,
      isPublic: false,
    }
  }

  return context
}
