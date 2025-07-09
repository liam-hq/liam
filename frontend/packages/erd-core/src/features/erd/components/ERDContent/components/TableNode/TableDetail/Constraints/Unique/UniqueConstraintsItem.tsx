import type { UniqueConstraint } from '@liam-hq/db-structure'
import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
} from '@liam-hq/ui'
import type { FC } from 'react'

type Props = {
  uniqueConstraint: UniqueConstraint
}

export const UniqueConstraintsItem: FC<Props> = ({ uniqueConstraint }) => {
  return (
    <GridTableRoot>
      <GridTableHeader>{uniqueConstraint.name}</GridTableHeader>
      <GridTableItem>
        <GridTableDt>
          {uniqueConstraint.columnNames.length === 1 ? 'Column' : 'Columns'}
        </GridTableDt>
        <GridTableDd>{uniqueConstraint.columnNames.join(', ')}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
