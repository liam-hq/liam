import { useDBStructureStore } from '@/stores'
import * as Dialog from '@radix-ui/react-dialog'
import Fuse from 'fuse.js'
import { Hash, Rows3, Table2 } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './SearchOverlay.module.css'

const iconMap = {
  table: Table2,
  column: Rows3,
  indices: Hash,
}

function buildSearchItems(data) {
  const items = []
  for (const tableKey of Object.keys(data.tables)) {
    const tableDef = data.tables[tableKey]
    items.push({
      table_id: tableDef.name,
      label: tableDef.name,
      type: 'table',
    })
    for (const colKey of Object.keys(tableDef.columns)) {
      const colDef = tableDef.columns[colKey]
      items.push({
        table_id: tableDef.name,
        label: colDef.name,
        type: 'column',
      })
    }
    for (const idxKey of Object.keys(tableDef.indices)) {
      const idxDef = tableDef.indices[idxKey]
      items.push({
        table_id: tableDef.name,
        label: idxDef.name,
        type: 'indices',
      })
    }
  }
  return items
}

function sortByTableColumnIndices(items) {
  const groupMap = new Map()
  for (const item of items) {
    if (!groupMap.has(item.table_id)) {
      groupMap.set(item.table_id, [])
    }
    groupMap.get(item.table_id).push(item)
  }
  const sorted = []
  for (const tableId of groupMap.keys()) {
    const group = groupMap.get(tableId)
    const sortedGroup = [
      ...group.filter((g) => g.type === 'table'),
      ...group.filter((g) => g.type === 'column'),
      ...group.filter((g) => g.type === 'indices'),
    ]
    sorted.push(...sortedGroup)
  }
  return sorted
}

const SearchOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const structure = useDBStructureStore()
  // const structure = {
  //   tables: {
  //     account_aliases: {
  //       name: 'account_aliases',
  //       indices: {
  //         index_account_aliases_on_account_id_and_uri: {
  //           name: 'index_account_aliases_on_account_id_and_uri',
  //           unique: true,
  //           columns: ['account_id', 'uri'],
  //         },
  //         index_account_aliases_on_account_id: {
  //           name: 'index_account_aliases_on_account_id',
  //           unique: false,
  //           columns: ['account_id'],
  //         },
  //       },
  //       columns: {
  //         id: {
  //           name: 'id',
  //         },
  //         account_id: {
  //           name: 'account_id',
  //         },
  //         acct: {
  //           name: 'acct',
  //         },
  //         uri: {
  //           name: 'uri',
  //         },
  //         created_at: {
  //           name: 'created_at',
  //         },
  //         updated_at: {
  //           name: 'updated_at',
  //         },
  //       },
  //     },
  //     account_conversations: {
  //       name: 'account_conversations',
  //       indices: {
  //         index_unique_conversations: {
  //           name: 'index_unique_conversations',
  //           unique: true,
  //           columns: ['account_id', 'conversation_id', 'participant_account_ids'],
  //         },
  //         index_account_conversations_on_conversation_id: {
  //           name: 'index_account_conversations_on_conversation_id',
  //           unique: false,
  //           columns: ['conversation_id'],
  //         },
  //       },
  //       columns: {
  //         id: {
  //           name: 'id',
  //         },
  //         account_id: {
  //           name: 'account_id',
  //         },
  //         conversation_id: {
  //           name: 'conversation_id',
  //         },
  //         participant_account_ids: {
  //           name: 'participant_account_ids',
  //         },
  //         status_ids: {
  //           name: 'status_ids',
  //         },
  //         last_status_id: {
  //           name: 'last_status_id',
  //         },
  //         lock_version: {
  //           name: 'lock_version',
  //         },
  //         unread: {
  //           name: 'unread',
  //         },
  //       },
  //     },
  //     account_deletion_requests: {
  //       name: 'account_deletion_requests',
  //       indices: {
  //         index_account_deletion_requests_on_account_id: {
  //           name: 'index_account_deletion_requests_on_account_id',
  //           unique: false,
  //           columns: ['account_id'],
  //         },
  //       },
  //       columns: {
  //         id: {
  //           name: 'id',
  //         },
  //         account_id: {
  //           name: 'account_id',
  //         },
  //         created_at: {
  //           name: 'created_at',
  //         },
  //         updated_at: {
  //           name: 'updated_at',
  //         },
  //       },
  //     },
  //   },
  //   relationships: {},
  // }

  const allItems = useMemo(() => buildSearchItems(structure), [structure])

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ['label'],
        threshold: 0.3,
      }),
    [allItems],
  )

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      setIsOpen(true)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const filtered = useMemo(() => {
    if (!search) return []
    const results = fuse.search(search).map((r) => r.item)
    return sortByTableColumnIndices(results)
  }, [search, fuse])

  const finalResults = useMemo(
    () =>
      filtered.map((item) => {
        const IconComponent = iconMap[item.type]
        return {
          ...item,
          icon: IconComponent ? (
            <IconComponent className={styles.icon} />
          ) : null,
        }
      }),
    [filtered],
  )

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={styles.hiddenButton}>
          Open Search
        </button>
      </Dialog.Trigger>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.content}>
        <div className={styles.searchContainer}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className={styles.input}
            />
            <button
              type="button"
              aria-label="Close Search"
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
            >
              Esc
            </button>
          </div>
          <div className={styles.resultsContainer}>
            {finalResults.map((result, index) => (
              <button
                type="button"
                key={`k_${index}_${result.label}`}
                className={styles.resultItem}
              >
                {result.type !== 'table' && (
                  <div className={styles.indentLine} />
                )}
                {result.icon}
                <p className={styles.resultText}>{result.label}</p>
              </button>
            ))}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default SearchOverlay
