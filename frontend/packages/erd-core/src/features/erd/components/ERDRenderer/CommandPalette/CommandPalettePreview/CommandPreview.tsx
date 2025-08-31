import type { FC } from 'react'
import copyLink from './assets/copy-link.mp4'
import copyLinkThumbnail from './assets/copy-link-thumbnail.png'
import showAllFields from './assets/show-all-fields.png'
import showKeyOnly from './assets/show-key-only.png'
import showTableName from './assets/show-table-name.png'
import tidyUp from './assets/tidy-up.mp4'
import zoomToFit from './assets/zoom-to-fit.mp4'
import styles from './CommandPalettePreview.module.css'

type Props = {
  commandName: string
}

const COMMAND_VIDEO_SOURCE: Record<
  string,
  { video: string; thumbnail?: string | { src: string } }
> = {
  'copy link': { video: copyLink, thumbnail: copyLinkThumbnail },
  'Zoom to Fit': { video: zoomToFit },
  'Tidy Up': { video: tidyUp },
}

const COMMAND_IMAGE_SOURCE: Record<string, string | { src: string }> = {
  'Show All Fields': showAllFields,
  'Show Key Only': showKeyOnly,
  'Show Table Name': showTableName,
}

const getImage = (img: string | { src: string }) =>
  typeof img === 'object' ? img.src : img

export const CommandPreview: FC<Props> = ({ commandName }) => {
  return (
    <div className={styles.container}>
      {COMMAND_VIDEO_SOURCE[commandName] && (
        <video
          muted
          autoPlay
          className={styles.video}
          key={commandName}
          poster={
            COMMAND_VIDEO_SOURCE[commandName].thumbnail
              ? getImage(COMMAND_VIDEO_SOURCE[commandName].thumbnail)
              : undefined
          }
        >
          <source
            src={COMMAND_VIDEO_SOURCE[commandName].video}
            type="video/mp4"
          />
        </video>
      )}
      {COMMAND_IMAGE_SOURCE[commandName] && (
        <img
          src={getImage(COMMAND_IMAGE_SOURCE[commandName])}
          className={styles.image}
          alt=""
        />
      )}
    </div>
  )
}
