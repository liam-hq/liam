import type { FC } from 'react'
import CopyLinkPreview from './asserts/copy-link-preview.gif'
import styles from './CommandPalettePreview.module.css'

export const CommandPreview: FC = () => {
  return (
    <div className={styles.container}>
      <img
        className={styles.previewImage}
        src={
          typeof CopyLinkPreview === 'string'
            ? CopyLinkPreview
            : typeof CopyLinkPreview.src === 'string'
              ? CopyLinkPreview.src
              : undefined
        }
        alt=""
      />
    </div>
  )
}
