import type { FC } from 'react'
import styles from './OutputPlaceholder.module.css'
import { PreviewIllustration } from './PreviewIllustration'

export const OutputPlaceholder: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <PreviewIllustration width={120} height={90} />
        <div className={styles.previewText}>
          Your preview will appear here...
        </div>
      </div>
    </div>
  )
}
