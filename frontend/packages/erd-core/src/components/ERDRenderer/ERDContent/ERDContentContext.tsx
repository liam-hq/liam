import {
  type FC,
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from 'react'

type ERDContentContextState = {
  loading: boolean
  initializeComplete: boolean
  autoLayoutComplete: boolean
}

type ERDContentContextActions = {
  setLoading: (loading: boolean) => void
  setInitializeComplete: (initializeComplete: boolean) => void
  setAutoLayoutComplete: (autoLayoutComplete: boolean) => void
}

type ERDContentConextValue = {
  state: ERDContentContextState
  actions: ERDContentContextActions
}

const ERDContentContext = createContext<ERDContentConextValue>({
  state: {
    loading: true,
    initializeComplete: false,
    autoLayoutComplete: false,
  },
  actions: {
    setLoading: () => {},
    setInitializeComplete: () => {},
    setAutoLayoutComplete: () => {},
  },
})

export const useERDContentContext = () => useContext(ERDContentContext)

export const ERDContentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [initializeComplete, setInitializeComplete] = useState(false)
  const [autoLayoutComplete, setAutoLayoutComplete] = useState(false)

  return (
    <ERDContentContext.Provider
      value={{
        state: { loading, initializeComplete, autoLayoutComplete },
        actions: { setLoading, setInitializeComplete, setAutoLayoutComplete },
      }}
    >
      {children}
    </ERDContentContext.Provider>
  )
}
