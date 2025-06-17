'use client'

import { type FC, type ReactNode, useState } from 'react'
import { OutputUIContext } from '../contexts/OutputUIContext'
import { DEFAULT_VERSION, VERSION_DATA } from '../mock/versionData'

type Props = {
  children: ReactNode
}

export const OutputUIProvider: FC<Props> = ({ children }) => {
  const [selectedVersion, setSelectedVersion] =
    useState<number>(DEFAULT_VERSION)

  const contextValue = {
    state: {
      selectedVersion,
    },
    actions: {
      setSelectedVersion,
    },
    versionData: VERSION_DATA,
  }

  return (
    <OutputUIContext.Provider value={contextValue}>
      {children}
    </OutputUIContext.Provider>
  )
}
