import type { Table } from '@liam-hq/schema'
import { Lock } from '@liam-hq/ui'
import type React from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { CheckConstraints } from './CheckConstraints'
import { ForeignKeyConstraints } from './ForeignKeyConstraints'
import { PrimaryKeyConstraints } from './PrimaryKeyConstraints'
import { UniqueConstraints } from './UniqueConstraints'

type Props = {
  table: Table
}

export const Constraints: React.FC<Props> = ({ table }) => {
  const tableId = table.name
  const constraints = Object.values(table.constraints)

  const primaryKeyConstraints = constraints.filter(
    (constraint) => constraint.type === 'PRIMARY KEY',
  )
  const foreignKeyConstraints = constraints.filter(
    (constraint) => constraint.type === 'FOREIGN KEY',
  )
  const uniqueConstraints = constraints.filter(
    (constraint) => constraint.type === 'UNIQUE',
  )
  const checkConstraints = constraints.filter(
    (constraint) => constraint.type === 'CHECK',
  )

  // NOTE: 400px is higher enough than each table, even considering titles and padding of its section.
  const contentMaxHeight = constraints.length * 400

  return (
    <CollapsibleHeader
      title="Constraints #"
      icon={<Lock width={12} />}
      isContentVisible={true}
      // NOTE: Header height for Columns and Indexes section:
      // (40px (content) + 1px (border))) * 2 = 82px
      stickyTopHeight={82}
      contentMaxHeight={contentMaxHeight}
    >
      {primaryKeyConstraints.length > 0 && (
        <PrimaryKeyConstraints
          tableId={tableId}
          constraints={primaryKeyConstraints}
        />
      )}
      {foreignKeyConstraints.length > 0 && (
        <ForeignKeyConstraints
          tableId={tableId}
          constraints={foreignKeyConstraints}
        />
      )}
      {uniqueConstraints.length > 0 && (
        <UniqueConstraints tableId={tableId} constraints={uniqueConstraints} />
      )}
      {checkConstraints.length > 0 && (
        <CheckConstraints tableId={tableId} constraints={checkConstraints} />
      )}
    </CollapsibleHeader>
  )
}
