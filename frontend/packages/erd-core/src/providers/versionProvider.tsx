import { err, ok, type Result } from 'neverthrow'
import { createContext, type FC, type ReactNode, useContext } from 'react'
import type { Version } from '@/schemas/version'

type VersionContextProps = {
  version: Version
}

const VersionContext = createContext<VersionContextProps | undefined>(undefined)

const useVersion = (): Result<VersionContextProps, Error> => {
  const context = useContext(VersionContext)
  if (!context) {
    return err(new Error('useVersion must be used within a VersionProvider'))
  }
  return ok(context)
}

export const useVersionOrThrow = (): VersionContextProps => {
  const result = useVersion()
  if (result.isErr()) {
    throw result.error
  }
  return result.value
}
export const VersionProvider: FC<{
  version: Version
  children: ReactNode
}> = ({ version, children }) => {
  return (
    <VersionContext.Provider value={{ version }}>
      {children}
    </VersionContext.Provider>
  )
}
