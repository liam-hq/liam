import type { FC } from 'react'
import styles from './CommandPalettePreview.module.css'

type Props = {
  commandName: string
}

const COMMAND_VIDEO_SOURCE: Record<string, string> = {
  'copy link':
    'https://assets.liambx.com/erd-core/2025-09-01/videos/copy-link.mp4',
  'Zoom to Fit':
    'https://assets.liambx.com/erd-core/2025-09-01/videos/zoom-to-fit.mp4',
  'Tidy Up': 'https://assets.liambx.com/erd-core/2025-09-01/videos/tidy-up.mp4',
}

const COMMAND_IMAGE_SOURCE: Record<string, string> = {
  'Show All Fields':
    'https://assets.liambx.com/erd-core/2025-09-01/images/show-all-fields.png',
  'Show Key Only':
    'https://assets.liambx.com/erd-core/2025-09-01/images/show-key-only.png',
  'Show Table Name':
    'https://assets.liambx.com/erd-core/2025-09-01/images/show-table-name.png',
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
