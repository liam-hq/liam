import { pushToDataLayer } from './pushToDataLayer'

type ClickLogEvent = {
  element: string
  cliVer: string
  appEnv: string
}

export const clickLogEvent = ({ element, cliVer, appEnv }: ClickLogEvent) => {
  pushToDataLayer({
    event: 'click',
    element,
    cliVer,
    appEnv,
  })
}
