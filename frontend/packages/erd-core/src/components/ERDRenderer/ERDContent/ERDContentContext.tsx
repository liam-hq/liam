import {
  type FC,
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from 'react'

type LayoutStatus = 'not-started' | 'in-progress' | 'complete'

type ERDContentContextState = {
  loading: boolean
  initializeComplete: boolean
  //
  // layoutStatus: LayoutStatus
}

type ERDContentContextActions = {
  setLoading: (loading: boolean) => void
  setInitializeComplete: (initializeComplete: boolean) => void
  // setLayoutStatus: (layoutStatus: LayoutStatus) => void
}

type ERDContentConextValue = {
  state: ERDContentContextState
  actions: ERDContentContextActions
}

const ERDContentContext = createContext<ERDContentConextValue>({
  state: {
    loading: true,
    initializeComplete: false,
    //
    // layoutStatus: 'not-started',
  },
  actions: {
    setLoading: () => {},
    setInitializeComplete: () => {},
    // setLayoutStatus: () => {},
  },
})

export const useERDContentContext = () => useContext(ERDContentContext)

export const ERDContentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [initializeComplete, setInitializeComplete] = useState(false)
  //
  const [layoutStatus, setLayoutStatus] = useState<LayoutStatus>('not-started')

  return (
    <ERDContentContext.Provider
      value={{
        state: {
          loading,
          initializeComplete,
          // layoutStatus,
        },
        actions: {
          setLoading,
          setInitializeComplete,
          // setLayoutStatus,
        },
      }}
    >
      {children}
    </ERDContentContext.Provider>
  )
}
