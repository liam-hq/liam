'use client'

import { useContext } from 'react'
import {
  OutputUIContext,
  type OutputUIContextType,
} from '../contexts/OutputUIContext'

export const useOutputUI = (): OutputUIContextType => {
  const context = useContext(OutputUIContext)

  if (!context) {
    throw new Error('useOutputUI must be used within an OutputUIProvider')
  }

  return context
}
