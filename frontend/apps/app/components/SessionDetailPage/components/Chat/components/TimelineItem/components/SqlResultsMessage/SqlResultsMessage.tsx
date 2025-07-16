'use client'

import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import { QueryResultBox } from '../../../../../../../PGlitePage/QueryResultBox'
import styles from './SqlResultsMessage.module.css'

type Props = {
  results: SqlResult[]
  title: string
}

export const SqlResultsMessage = ({ results, title }: Props) => {
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.resultsContainer}>
        {results.map((result) => (
          <QueryResultBox key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
