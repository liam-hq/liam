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
import type { MentionCandidate } from './types'

export const MentionIcon: FC<{ item: MentionCandidate }> = ({ item }) => {
  // Handle undefined item or type
  if (!item || !item.type) return null

  // Handle different item types
  if (item.type === 'table') return <Table2 size={16} />
  if (item.type === 'group') return <Group size={16} />
  if (item.type === 'relation') return <Waypoints size={16} />

  if (item.type === 'column') {
    // Display icon based on columnType property
    const columnType = item.columnType || 'nullable'

    switch (columnType) {
      case 'primary':
        return (
          <KeyRound
            width={16}
            height={16}
            role="img"
            aria-label="Primary Key"
            strokeWidth={1.5}
          />
        )

      case 'foreign':
        return (
          <Link
            width={16}
            height={16}
            role="img"
            aria-label="Foreign Key"
            strokeWidth={1.5}
          />
        )

      case 'notNull':
        return (
          <DiamondFillIcon
            width={16}
            height={16}
            role="img"
            aria-label="Not Null"
          />
        )

      // Default case (nullable)
      default:
        return (
          <DiamondIcon
            width={16}
            height={16}
            role="img"
            aria-label="Nullable"
          />
        )
    }
  }

  // Return null if no matching type is found
  return null
}
