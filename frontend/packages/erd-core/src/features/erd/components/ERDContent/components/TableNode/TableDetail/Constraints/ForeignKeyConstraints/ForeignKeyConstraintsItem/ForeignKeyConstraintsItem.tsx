import type { ForeignKeyConstraint } from '@liam-hq/schema'
import { GridTableRoot } from '@liam-hq/ui'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../../diff/hooks/useDiffStyle'
import { Columns } from './Columns'
import { getChangeStatus } from './getChangeStatus'
import { Name } from './Name'
import { OnDelete } from './OnDelete'
import { OnUpdate } from './OnUpdate'
import { TargetTable } from './TargetTable'

type Props = {
  tableId: string
  foreignKeyConstraint: ForeignKeyConstraint
}

export const ForeignKeyConstraintsItem: FC<Props> = ({
  tableId,
  foreignKeyConstraint,
}) => {
  const { operations } = useSchemaOrThrow()
  const { showDiff } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      constraintId: foreignKeyConstraint.name,
    })
  }, [showDiff, tableId, operations, foreignKeyConstraint.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  return (
    <div className={diffStyle}>
      <GridTableRoot>
        <Name tableId={tableId} constraint={foreignKeyConstraint} />
        <Columns tableId={tableId} constraint={foreignKeyConstraint} />
        <TargetTable tableId={tableId} constraint={foreignKeyConstraint} />
        <OnUpdate tableId={tableId} constraint={foreignKeyConstraint} />
        <OnDelete tableId={tableId} constraint={foreignKeyConstraint} />
      </GridTableRoot>
    </div>
  )
}
