import type { FC } from 'react'
import styles from './MigrationsViewer.module.css'
import { useMigrationsViewer } from './useMigrationsViewer'

type Props = {
  initialDoc: string
}

export const MigrationsViewer: FC<Props> = ({ initialDoc }) => {
  const { ref } = useMigrationsViewer({
    initialDoc,
  })

  return <div ref={ref} className={styles.wrapper} />
}
