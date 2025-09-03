import type { FC } from 'react'
import { ASSET_URLS } from '../../../../../../config/assetUrls'
import styles from './CommandPalettePreview.module.css'

type Props = {
  commandName: string
}

const COMMAND_VIDEO_SOURCE: Record<string, string> = {
  'copy link': ASSET_URLS.videos.copyLink,
  'Zoom to Fit': ASSET_URLS.videos.zoomToFit,
  'Tidy Up': ASSET_URLS.videos.tidyUp,
}

const COMMAND_IMAGE_SOURCE: Record<string, string> = {
  'Show All Fields': ASSET_URLS.images.showAllFields,
  'Show Key Only': ASSET_URLS.images.showKeyOnly,
  'Show Table Name': ASSET_URLS.images.showTableName,
}

export const CommandPreview: FC<Props> = ({ commandName }) => {
  return (
    <div className={styles.container}>
      {COMMAND_VIDEO_SOURCE[commandName] && (
        <video
          muted
          autoPlay
          className={styles.video}
          key={commandName}
          aria-label={`Demonstration of the ${commandName} command execution result`}
        >
          <source src={COMMAND_VIDEO_SOURCE[commandName]} type="video/mp4" />
        </video>
      )}
      {COMMAND_IMAGE_SOURCE[commandName] && (
        <img
          src={COMMAND_IMAGE_SOURCE[commandName]}
          className={styles.image}
          alt={`Demonstration of the ${commandName} command execution result`}
        />
      )}
    </div>
  )
}
