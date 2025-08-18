'use client'

import { useContext } from 'react'
import { ViewModeContext } from '../../contexts/ViewModeContext'

export const useViewMode = () => {
  const context = useContext(ViewModeContext)

  if (!context) {
    // eslint-disable-next-line no-throw-error/no-throw-error
    throw new Error('useViewMode must be used within ViewModeProvider')
  }

  return context
}
