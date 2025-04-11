import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './IndexesItem.module.css'

type Props = {
  index: {
    name: string
    unique: boolean
    columns: string[]
    type: string
  }
}

export const IndexesItem: FC<Props> = ({ index }) => {
  const HIDE_INDEX_TYPE = 'btree'

  return (
    <div className={styles.wrapper}>
      <GridTableRoot>
        <GridTableHeader>{index.name}</GridTableHeader>
        {index.type && index.type.toLowerCase() !== HIDE_INDEX_TYPE && (
          <GridTableItem>
            <GridTableDt>Type</GridTableDt>
            <GridTableDd>{index.type}</GridTableDd>
          </GridTableItem>
        )}
        {!!index.columns.length && (
          <GridTableItem>
            <GridTableDt>
              {index.columns.length === 1 ? 'Column' : 'Columns'}
            </GridTableDt>
            <GridTableDd>
              {index.columns.length === 1 ? (
                index.columns[0]
              ) : (
                <ol className={styles.list}>
                  {index.columns.map((column) => (
                    <li key={column}>{column}</li>
                  ))}
                </ol>
              )}
            </GridTableDd>
          </GridTableItem>
        )}
        <GridTableItem>
          <GridTableDt>Unique</GridTableDt>
          <GridTableDd>{index.unique ? 'Yes' : 'No'}</GridTableDd>
        </GridTableItem>
      </GridTableRoot>
    </div>
  )
}
