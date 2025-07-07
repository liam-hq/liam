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
        <GridTableDt>Columns</GridTableDt>
        <GridTableDd>{uniqueConstraint.columnNames.join(', ')}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
