import type { ForeignKeyConstraint } from '@liam-hq/db-structure'
import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
  Table2,
} from '@liam-hq/ui'
import type React from 'react'
import styles from './ForeignKeyConstraintsItem.module.css'

type Props = {
  foreignKeyConstraint: ForeignKeyConstraint
}

export const ForeignKeyConstraintsItem: React.FC<Props> = ({
  foreignKeyConstraint,
}) => {
  return (
    <GridTableRoot>
      <GridTableHeader>{foreignKeyConstraint.name}</GridTableHeader>
      <GridTableItem>
        <GridTableDt>Column</GridTableDt>
        <GridTableDd>{foreignKeyConstraint.columnName}</GridTableDd>
      </GridTableItem>
      <GridTableItem>
        <GridTableDt>Target Table</GridTableDt>
        <GridTableDd>
          <Table2 className={styles.tableKeyIcon} />
          {`${foreignKeyConstraint.targetTableName}.${foreignKeyConstraint.targetColumnName}`}
        </GridTableDd>
      </GridTableItem>
      <GridTableItem>
        <GridTableDt>On Update</GridTableDt>
        <GridTableDd>{foreignKeyConstraint.updateConstraint}</GridTableDd>
      </GridTableItem>
      <GridTableItem>
        <GridTableDt>On Delete</GridTableDt>
        <GridTableDd>{foreignKeyConstraint.deleteConstraint}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
