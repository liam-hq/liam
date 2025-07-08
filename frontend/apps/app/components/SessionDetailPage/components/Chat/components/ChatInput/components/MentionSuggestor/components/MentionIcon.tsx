import {
  DiamondFillIcon,
  DiamondIcon,
  Group,
  KeyRound,
  Link,
  Table2,
  Waypoints,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import type { MentionItem } from '../../../types'

type Props = {
  item: MentionItem
}

export const MentionIcon: FC<Props> = ({ item }) => {
  // Handle undefined item or type
  if (!item || !item.type) return null

  return match(item.type)
    .with('table', () => <Table2 size={16} />)
    .with('group', () => <Group size={16} />)
    .with('relation', () => <Waypoints size={16} />)
    .with('column', () => {
      // Display icon based on columnType property
      const columnType = item.columnType || 'nullable'

      return match(columnType)
        .with('primary', () => (
          <KeyRound
            width={16}
            height={16}
            role="img"
            aria-label="Primary Key"
            strokeWidth={1.5}
          />
        ))
        .with('foreign', () => (
          <Link
            width={16}
            height={16}
            role="img"
            aria-label="Foreign Key"
            strokeWidth={1.5}
          />
        ))
        .with('notNull', () => (
          <DiamondFillIcon
            width={16}
            height={16}
            role="img"
            aria-label="Not Null"
          />
        ))
        .otherwise(() => (
          <DiamondIcon
            width={16}
            height={16}
            role="img"
            aria-label="Nullable"
          />
        ))
    })
    .exhaustive()
}
