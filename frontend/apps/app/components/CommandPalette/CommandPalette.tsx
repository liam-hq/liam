'use client'
import { ERDContent } from '@/features/erd/components/ERDContent'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
// import { convertSchemaToNodes } from '@/features/erd/utils'
import { useSchemaStore } from '@/stores'
import { type Node, ReactFlowProvider } from '@xyflow/react'
import { Command } from 'cmdk'
import { useEffect, useState } from 'react'
import * as v from 'valibot'
import styles from './CommandPalette.module.css'

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const schema = useSchemaStore()
  // const { nodes, edges } = convertSchemaToNodes({
  //   schema,
  //   showMode: 'ALL_FIELDS',
  // })
  const [nodes, setNodes] = useState<Node[]>([])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  })

  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = v.parse(versionSchema, versionData)

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      contentClassName={styles.content}
    >
      <Command.Input />
      <div className={styles.main}>
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>

          <Command.Group heading="Suggestions">
            {Object.values(schema.tables).map((table) => (
              <Command.Item
                key={table.name}
                onSelect={() => {
                  setNodes(() => [
                    {
                      id: table.name,
                      type: 'table',
                      data: { table },
                      position: { x: 0, y: 0 },
                    },
                  ])
                }}
              >
                {table.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div>
          <VersionProvider version={version}>
            <ReactFlowProvider>
              <ERDContent
                nodes={nodes}
                edges={[]}
                displayArea="relatedTables"
              />
            </ReactFlowProvider>
          </VersionProvider>
        </div>
      </div>
    </Command.Dialog>
  )
}
