import type { FC } from 'react'
import styles from './MigrationsViewer.module.css'
import { useMigrationsViewer } from './useMigrationsViewer'

type Props = {
  doc: string
}

export const MigrationsViewer: FC<Props> = ({ doc }) => {
  const { ref } = useMigrationsViewer({
    doc,
  })

  return <div ref={ref} className={styles.wrapper} />
}
