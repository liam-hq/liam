import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useState,
} from 'react'

type ErdContentContextState = {
  loading: boolean
}

type ErdContentContextActions = {
  setLoading: (loading: boolean) => void
}

type ErdContentConextValue = {
  state: ErdContentContextState
  actions: ErdContentContextActions
}

const ErdContentContext = createContext<ErdContentConextValue>({
  state: {
    loading: true,
  },
  actions: {
    setLoading: () => {},
  },
})

export const useErdContentContext = () => useContext(ErdContentContext)

export const ErdContentProvider: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)

  return (
    <ErdContentContext.Provider
      value={{
        state: { loading },
        actions: { setLoading },
      }}
    >
      {children}
    </ErdContentContext.Provider>
  )
}
