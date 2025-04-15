import type { CheckConstraint } from '@liam-hq/db-structure'
import {
  GridTableDd,
  GridTableDt,
  GridTableHeader,
  GridTableItem,
  GridTableRoot,
} from '@liam-hq/ui'
import type React from 'react'

type Props = {
  checkConstraint: CheckConstraint
}

export const CheckConstraintsItem: React.FC<Props> = ({ checkConstraint }) => {
  return (
    <GridTableRoot>
      <GridTableHeader>{checkConstraint.name}</GridTableHeader>
      <GridTableItem>
        <GridTableDt>Detail</GridTableDt>
        <GridTableDd>{checkConstraint.detail}</GridTableDd>
      </GridTableItem>
    </GridTableRoot>
  )
}
