import { pushToDataLayer } from './pushToDataLayer'

type RepositionTable = {
  tableId: string
  operationId: string
  cliVer: string
  appEnv: string
}

export const repositionTableLogEvent = ({
  tableId,
  operationId,
  cliVer,
  appEnv,
}: RepositionTable) => {
  pushToDataLayer({
    event: 'repositionTable',
    tableId,
    operationId,
    cliVer,
    appEnv,
  })
}
