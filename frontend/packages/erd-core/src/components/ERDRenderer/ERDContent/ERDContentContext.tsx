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
  foo: boolean
}

type ERDContentContextActions = {
  setLoading: (loading: boolean) => void
  setInitializeComplete: (initializeComplete: boolean) => void
  setFoo: (foo: boolean) => void
}

type ERDContentConextValue = {
  state: ERDContentContextState
  actions: ERDContentContextActions
}

const ERDContentContext = createContext<ERDContentConextValue>({
  state: {
    loading: true,
    initializeComplete: false,
    foo: false,
  },
  actions: {
    setLoading: () => {},
    setInitializeComplete: () => {},
    setFoo: () => {},
  },
})

export const useERDContentContext = () => useContext(ERDContentContext)

export const ERDContentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [initializeComplete, setInitializeComplete] = useState(false)
  const [foo, setFoo] = useState(false)

  return (
    <ERDContentContext.Provider
      value={{
        state: { loading, initializeComplete, foo },
        actions: { setLoading, setInitializeComplete, setFoo },
      }}
    >
      {children}
    </ERDContentContext.Provider>
  )
}
