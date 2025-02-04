import { useDBStructureStore } from '@/stores'
import type { DBStructure } from '@liam-hq/db-structure'
import { create, insert, search as oramaSearch } from '@orama/orama'
import type { Orama } from '@orama/orama'
import * as Dialog from '@radix-ui/react-dialog'
import Fuse from 'fuse.js'
import { Hash, Rows3, Table2 } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './SearchOverlay.module.css'

// Icon mapping
const iconMap = {
  table: Table2,
  column: Rows3,
  indices: Hash,
}

// Data type definition
type Item = {
  tableId: string
  content: string
  type: 'table' | 'column' | 'indices'
}

// Generate search items from DB structure
function buildSearchItems(data: DBStructure) {
  console.info('buildSearchItems start')
  const start = performance.now()

  const items: Item[] = []
  for (const tableKey of Object.keys(data.tables)) {
    const tableDef = data.tables[tableKey]
    if (!tableDef) {
      continue
    }
    items.push({
      tableId: tableDef.name,
      content: tableDef.name,
      type: 'table',
    })
    for (const colKey of Object.keys(tableDef.columns)) {
      const colDef = tableDef.columns[colKey]
      if (!colDef) {
        continue
      }
      items.push({
        tableId: tableDef.name,
        content: colDef.name,
        type: 'column',
      })
    }
    for (const idxKey of Object.keys(tableDef.indices)) {
      const idxDef = tableDef.indices[idxKey]
      if (!idxDef) {
        continue
      }
      items.push({
        tableId: tableDef.name,
        content: idxDef.name,
        type: 'indices',
      })
    }
  }

  const end = performance.now()
  console.info(`buildSearchItems completed in ${end - start} ms`)

  return items
}

// Sort items in the order of table, column, indices
function sortByTableColumnIndices(items: Item[]): Item[] {
  console.info('sortByTableColumnIndices start')
  const start = performance.now()

  const groupMap = new Map<string, Item[]>()
  for (const item of items) {
    if (!groupMap.has(item.tableId)) {
      const group: Item[] = []
      groupMap.set(item.tableId, group)
    }
    groupMap.get(item.tableId)?.push(item)
  }
  const sorted: Item[] = []
  const tableIds = Array.from(groupMap.keys())
  for (const tableId of tableIds) {
    const group = groupMap.get(tableId)
    if (!group) {
      continue
    }
    const hasTable = group.some((g) => g.type === 'table')

    if (!hasTable) {
      group.unshift({
        tableId: tableId,
        content: tableId,
        type: 'table',
      })
    }

    const sortedGroup = [
      ...group.filter((g) => g.type === 'table'),
      ...group.filter((g) => g.type === 'column'),
      ...group.filter((g) => g.type === 'indices'),
    ]
    sorted.push(...sortedGroup)
  }

  const end = performance.now()
  console.info(`sortByTableColumnIndices completed in ${end - start} ms`)

  return sorted
}

const SearchOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [engine, setEngine] = useState<'fuse' | 'orama'>('fuse')

  // Retrieve DB structure
  const structure = useDBStructureStore()

  // Build items for search
  const allItems = useMemo(() => buildSearchItems(structure), [structure])

  // Initialize Fuse.js instance
  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ['content'],
        threshold: 0.3,
      }),
    [allItems],
  )

  // biome-ignore lint/suspicious/noExplicitAny: this is poc code
  const [oramaDb, setOramaDb] = useState<Orama<any> | null>(null)

  // Build Orama DB
  useEffect(() => {
    ;(async () => {
      console.info('Orama DB creation start')
      const start = performance.now()

      const db = create({
        schema: {
          tableId: 'string',
          content: 'string',
          type: 'string',
        },
      })

      for (const item of allItems) {
        await insert(db, {
          tableId: item.tableId,
          content: item.content,
          type: item.type,
        })
      }

      setOramaDb(db)

      const end = performance.now()
      console.info(`Orama DB creation completed in ${end - start} ms`)
    })()
  }, [allItems])

  // Open overlay with cmd + k, close with Esc
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

  // Search logic
  const filtered = useMemo(() => {
    if (!search) return []
    if (engine === 'fuse') {
      const fuseResults = fuse.search(search).map((r) => r.item)
      return sortByTableColumnIndices(fuseResults)
    }
    if (!oramaDb) return []
    return []
  }, [search, engine, fuse, oramaDb])

  const [oramaResults, setOramaResults] = useState<Item[]>([])

  useEffect(() => {
    if (engine === 'orama' && oramaDb && search) {
      ;(async () => {
        const { hits } = await oramaSearch(oramaDb, {
          term: search,
          properties: ['content'],
          limit: 100,
        })
        // biome-ignore lint/suspicious/noExplicitAny: this is poc code
        const oramaItems: Item[] = hits.map((h: any) => ({
          tableId: h.document.tableId,
          content: h.document.content,
          type: h.document.type,
        }))
        const sortedItems = sortByTableColumnIndices(oramaItems)
        setOramaResults(sortedItems)
      })()
    } else {
      setOramaResults([])
    }
  }, [engine, oramaDb, search])

  const finalResults = useMemo(() => {
    const base = engine === 'fuse' ? filtered : oramaResults
    return base.map((item) => {
      const IconComponent = iconMap[item.type]
      return {
        ...item,
        icon: IconComponent ? <IconComponent className={styles.icon} /> : null,
      }
    })
  }, [engine, filtered, oramaResults])

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
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  name="engine"
                  value="fuse"
                  checked={engine === 'fuse'}
                  onChange={() => setEngine('fuse')}
                />
                Fuse
              </label>
              <label>
                <input
                  type="radio"
                  name="engine"
                  value="orama"
                  checked={engine === 'orama'}
                  onChange={() => setEngine('orama')}
                />
                Orama
              </label>
            </div>
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
              <a
                href={`./?active=${result.tableId}`}
                key={`k_${index}_${result.content}`}
                className={styles.resultItem}
              >
                {result.type !== 'table' && (
                  <div className={styles.indentLine} />
                )}
                {result.icon}
                <p className={styles.resultText}>{result.content}</p>
              </a>
            ))}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default SearchOverlay
