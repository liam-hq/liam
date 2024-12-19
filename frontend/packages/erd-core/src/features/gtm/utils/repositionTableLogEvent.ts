import { pushToDataLayer } from './pushToDataLayer'

type repositionTable = {
  tableId: string
}

export const repositionTableLogEvent = ({ tableId }: repositionTable) => {
  pushToDataLayer({
    event: 'repositionTable',
    tableId,
  })
}
