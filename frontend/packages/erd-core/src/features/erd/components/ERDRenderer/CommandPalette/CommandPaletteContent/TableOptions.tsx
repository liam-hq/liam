import { Table2 } from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import { useSchemaOrThrow } from '@/stores'
import { getTableLinkHref, suggestionToString } from '../utils'
import styles from './CommandPaletteContent.module.css'

type Props = {
  goToERD: (tableName: string) => void
}

export const TableOptions: FC<Props> = ({ goToERD }) => {
  const schema = useSchemaOrThrow()

  return (
    <Command.Group heading="Tables">
      {Object.values(schema.current.tables).map((table) => (
        <Command.Item
          key={table.name}
          value={suggestionToString({ type: 'table', name: table.name })}
          className={styles.item}
          asChild
        >
          <a
            href={getTableLinkHref(table.name)}
            onClick={(event) => {
              // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
              if (event.ctrlKey || event.metaKey) {
                return
              }

              event.preventDefault()
              goToERD(table.name)
            }}
          >
            <Table2 className={styles.itemIcon} />
            <span className={styles.itemText}>{table.name}</span>
          </a>
        </Command.Item>
      ))}
    </Command.Group>
  )
}
