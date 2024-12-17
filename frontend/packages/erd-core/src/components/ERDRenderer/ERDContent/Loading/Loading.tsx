import { useRive } from '@rive-app/react-canvas'
import type { ComponentProps, FC } from 'react'

type Props = ComponentProps<'canvas'>

export const Loading: FC<Props> = (props) => {
  const { RiveComponent } = useRive({
    src: '/loading.riv',
    stateMachines: ['State Machine 1'],
    autoplay: true,
  })

  return <RiveComponent {...props} />
}
