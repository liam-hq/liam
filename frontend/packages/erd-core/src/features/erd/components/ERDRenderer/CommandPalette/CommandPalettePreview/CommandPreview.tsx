import type { FC } from 'react'
import copyLink from './assets/copy-link.mp4'
import showAllFields from './assets/show-all-fields.png'
import showKeyOnly from './assets/show-key-only.png'
import showTableName from './assets/show-table-name.png'
import tidyUp from './assets/tidy-up.mp4'
import zoomToFit from './assets/zoom-to-fit.mp4'
import styles from './CommandPalettePreview.module.css'

type Props = {
  commandName: string
}

const COMMAND_VIDEO_SOURCE: Record<string, string> = {
  'copy link': copyLink,
  'Zoom to Fit': zoomToFit,
  'Tidy Up': tidyUp,
}

const COMMAND_IMAGE_SOURCE: Record<string, string | { src: string }> = {
  'Show All Fields': showAllFields,
  'Show Key Only': showKeyOnly,
  'Show Table Name': showTableName,
}

export const CommandPreview: FC<Props> = ({ commandName }) => {
  return (
    <div className={styles.container}>
      {COMMAND_VIDEO_SOURCE[commandName] && (
        <video muted autoPlay className={styles.video} key={commandName}>
          <source src={COMMAND_VIDEO_SOURCE[commandName]} type="video/mp4" />
        </video>
      )}
      {COMMAND_IMAGE_SOURCE[commandName] && (
        <img
          src={
            typeof COMMAND_IMAGE_SOURCE[commandName] === 'string'
              ? COMMAND_IMAGE_SOURCE[commandName]
              : COMMAND_IMAGE_SOURCE[commandName].src
          }
          className={styles.image}
          alt=""
        />
      )}
    </div>
  )
}
