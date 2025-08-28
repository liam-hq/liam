import type { FC } from 'react'
import copyLink from './assets/copy-link.mp4'
import tidyUp from './assets/tidy-up.mp4'
import styles from './CommandPalettePreview.module.css'

type Props = {
  commandName: string
}

const COMMAND_SOURCE = {
  'copy link': copyLink,
  'Tidy Up': tidyUp,
}

export const CommandPreview: FC<Props> = ({ commandName }) => {
  return (
    <div className={styles.container}>
      <video muted autoPlay className={styles.video} key={commandName}>
        <source src={COMMAND_SOURCE[commandName]} type="video/mp4" />
      </video>
    </div>
  )
}
