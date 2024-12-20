import { pushToDataLayer } from './pushToDataLayer'

type OpenRelatedTablesLogEvent = {
  tableId: string
  cliVer: string
  appEnv: string
}

export const openRelatedTablesLogEvent = ({
  tableId,
  cliVer,
  appEnv,
}: OpenRelatedTablesLogEvent) => {
  pushToDataLayer({
    event: 'openRelatedTables',
    tableId,
    cliVer,
    appEnv,
  })
}
