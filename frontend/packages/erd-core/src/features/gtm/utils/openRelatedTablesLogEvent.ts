import { pushToDataLayer } from './pushToDataLayer'

type OpenRelatedTablesLogEvent = {
  tableId: string
}

export const openRelatedTablesLogEvent = ({
  tableId,
}: OpenRelatedTablesLogEvent) => {
  pushToDataLayer({
    event: 'open_related_tables',
    tableId,
  })
}
