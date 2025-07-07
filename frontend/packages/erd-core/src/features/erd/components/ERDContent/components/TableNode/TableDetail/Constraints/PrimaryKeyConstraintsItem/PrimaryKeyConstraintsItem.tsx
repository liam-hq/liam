import type { PrimaryKeyConstraint } from '@liam-hq/db-structure'
import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
} from '@liam-hq/ui'
import type { FC } from 'react'

type Props = {
  primaryKeyConstraint: PrimaryKeyConstraint
}

export const PrimaryKeyConstraintsItem: FC<Props> = ({
  primaryKeyConstraint,
}) => {
  return (
    <GridTableRoot>
      <GridTableHeader>{primaryKeyConstraint.name}</GridTableHeader>
      <GridTableItem>
        <GridTableDt>Columns</GridTableDt>
        <GridTableDd>{primaryKeyConstraint.columnNames.join(', ')}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
