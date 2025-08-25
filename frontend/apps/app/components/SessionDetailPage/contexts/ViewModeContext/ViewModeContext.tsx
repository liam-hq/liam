'use client'

import { createContext, type FC, type ReactNode, useMemo } from 'react'
import type { ViewMode, ViewModeContextValue } from './types'

export const ViewModeContext = createContext<ViewModeContextValue | null>({
  mode: 'private',
  isPublic: false,
})

type ViewModeProviderProps = {
  mode: ViewMode
  children: ReactNode
}

export const ViewModeProvider: FC<ViewModeProviderProps> = ({
  mode,
  children,
}) => {
  const value = useMemo<ViewModeContextValue>(
    () => ({
      mode,
      isPublic: mode === 'public',
    }),
    [mode],
  )

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  )
}
