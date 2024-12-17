import riveWASMResource from '@rive-app/canvas/rive.wasm?url'
import { RuntimeLoader, useRive } from '@rive-app/react-canvas'
import { type ComponentProps, type FC, useEffect } from 'react'

RuntimeLoader.setWasmUrl(riveWASMResource)

type Props = ComponentProps<'canvas'>

export const Loading: FC<Props> = (props) => {
  const { RiveComponent, rive } = useRive({
    src: '/loading.riv',
    stateMachines: ['State Machine 1'],
    autoplay: true,
  })

  useEffect(() => {
    if (rive) {
      console.log('Rive loaded')
    } else {
      console.log('Rive not loaded')
    }
  }, [rive])

  return <RiveComponent {...props} />
}
