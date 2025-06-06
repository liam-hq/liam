'use client'

import { Chat } from '@/components/Chat'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { BRD, type ErrorObject } from './BRD'
import styles from './Panel.module.css'

type Props = {
  schema: Schema
  errors: ErrorObject[]
}

export const Panel: FC<Props> = ({ schema, errors }) => {
  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat schemaData={schema} />
        </div>
        <BRD schema={schema} errors={errors} />
      </div>
    </div>
  )
}
