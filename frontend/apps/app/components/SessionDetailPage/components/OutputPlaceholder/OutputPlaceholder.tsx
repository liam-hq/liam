import { Fit, Layout, useRive } from '@rive-app/react-canvas'
import type { FC } from 'react'
import styles from './OutputPlaceholder.module.css'

const RiveComponent = () => {
  const { RiveComponent } = useRive({
    src: '/assets/loading_jack.riv',
    stateMachines: 'State Machine 1',
    layout: new Layout({
      fit: Fit.Contain,
    }),
    autoplay: true,
  })

  return <RiveComponent />
}

export const OutputPlaceholder: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.riveWrapper}>
          <RiveComponent />
        </div>
        <div className={styles.previewText}>
          Your preview will appear here...
        </div>
      </div>
    </div>
  )
}
