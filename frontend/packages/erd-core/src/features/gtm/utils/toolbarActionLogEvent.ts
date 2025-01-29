import { pushToDataLayer } from './pushToDataLayer'

type ToolbarActionLogEvent = {
  element: string
  zoomLevel?: string
  showMode?: string
  cliVer: string
  appEnv: string
}

export const toolbarActionLogEvent = ({
  element,
  zoomLevel,
  showMode,
  cliVer,
  appEnv,
}: ToolbarActionLogEvent) => {
  pushToDataLayer({
    event: 'toolbarAction',
    element,
    zoomLevel,
    showMode,
    cliVer,
    appEnv,
  })
}
