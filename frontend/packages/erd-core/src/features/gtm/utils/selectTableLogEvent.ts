import { pushToDataLayer } from './pushToDataLayer'

type SelectTable = {
  ref: 'leftPane' | 'mainArea'
  tableId: string
  cliVer: string
  appEnv: string
}

export const selectTableLogEvent = ({
  ref,
  tableId,
  cliVer,
  appEnv,
}: SelectTable) => {
  pushToDataLayer({
    event: 'selectTable',
    ref,
    tableId,
    cliVer,
    appEnv,
  })
}
