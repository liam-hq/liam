import {
  type FC,
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from 'react'

type ERDContentContextState = {
  loading: boolean
}

type ERDContentContextActions = {
  setLoading: (loading: boolean) => void
}

type ERDContentConextValue = {
  state: ERDContentContextState
  actions: ERDContentContextActions
}

const ERDContentContext = createContext<ERDContentConextValue>({
  state: {
    loading: true,
  },
  actions: {
    setLoading: () => {},
  },
})

export const useERDContentContext = () => useContext(ERDContentContext)

export const ERDContentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)

  return (
    <ERDContentContext.Provider
      value={{
        state: { loading },
        actions: { setLoading },
      }}
    >
      {children}
    </ERDContentContext.Provider>
  )
}
