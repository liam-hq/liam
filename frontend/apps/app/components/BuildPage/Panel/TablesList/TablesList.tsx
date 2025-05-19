import { SwitchRoot, SwitchThumb } from '@/components'
import type { Schema } from '@liam-hq/db-structure'
import { type FC, useState } from 'react'
import { DiffView } from './DiffView'
import { SingleView } from './SingleView'
import styles from './TablesList.module.css'

type Props = {
  before: Schema
  after: Schema
}

export const TablesList: FC<Props> = ({ after, before }) => {
  const [isDiffView, setIsDiffView] = useState(false)

  return (
    <div className={styles.wrapper}>
      <div className={styles.switchWrapper}>
        <label
          className={styles.switchLabel}
          htmlFor="diff-mode"
          style={{ paddingRight: 15 }}
        >
          Diff mode
        </label>
        <SwitchRoot
          className={styles.switchRoot}
          id="diff-mode"
          checked={isDiffView}
          onCheckedChange={setIsDiffView}
        >
          <SwitchThumb className={styles.switchThumb} />
        </SwitchRoot>
      </div>
      {isDiffView ? (
        <DiffView before={before} after={after} />
      ) : (
        <SingleView schema={after} />
      )}
    </div>
  )
}
