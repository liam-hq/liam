import { Table2 } from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import { useSchemaOrThrow } from '../../../../../../stores'
import { getTableLinkHref } from '../../../../utils/url/getTableLinkHref'
import type { CommandPaletteSuggestion } from '../types'
import { getSuggestionText } from '../utils'
import styles from './CommandPaletteOptions.module.css'
import { useTableOptionSelect } from './hooks/useTableOptionSelect'

type Props = {
  suggestion: CommandPaletteSuggestion | null
}

export const TableOptions: FC<Props> = ({ suggestion }) => {
  const schema = useSchemaOrThrow()

  const { optionSelectHandler } = useTableOptionSelect(suggestion)

  return (
    <Command.Group heading="Tables">
      {Object.values(schema.current.tables).map((table) => (
        <Command.Item
          key={table.name}
          value={getSuggestionText({ type: 'table', name: table.name })}
        >
          <a
            className={styles.item}
            href={getTableLinkHref(table.name)}
            onClick={(event) => optionSelectHandler(event, table.name)}
          >
            <Table2 className={styles.itemIcon} />
            <span className={styles.itemText}>{table.name}</span>
          </a>
        </Command.Item>
      ))}
    </Command.Group>
  )
}
