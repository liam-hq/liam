import { pushToDataLayer } from './pushToDataLayer'

type ClickLogEvent = {
  element: string
  zoomLevel?: string
  showMode?: string
}

export const clickLogEvent = ({
  element,
  zoomLevel,
  showMode,
}: ClickLogEvent) => {
  pushToDataLayer({
    event: 'click',
    element,
    zoomLevel,
    showMode,
  })
}
