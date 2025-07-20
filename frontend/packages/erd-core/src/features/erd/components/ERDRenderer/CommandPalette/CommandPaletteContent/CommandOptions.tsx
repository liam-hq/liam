import { Copy, KeyRound, PanelTop, RectangleHorizontal } from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import { useUserEditingOrThrow } from '@/stores'
import { useCommandPalette } from '../CommandPaletteProvider'
import styles from './CommandPaletteContent.module.css'

export const CommandOptions: FC = () => {
  const { setShowMode } = useUserEditingOrThrow()

  const commandPaletteResult = useCommandPalette()
  if (commandPaletteResult.isErr()) {
    throw commandPaletteResult.error
  }
  const { setOpen } = commandPaletteResult.value

  return (
    <Command.Group heading="Command">
      <Command.Item
        value="command|Copy Link"
        onSelect={() => navigator.clipboard.writeText(location.href)}
      >
        <Copy className={styles.itemIcon} />
        <span className={styles.itemText}>Copy Link</span>
      </Command.Item>
      <Command.Item
        value="command|Show All Fields"
        onSelect={() => {
          setShowMode('ALL_FIELDS')
          setOpen(false)
        }}
      >
        <PanelTop className={styles.itemIcon} />
        <span className={styles.itemText}>Show All Fields</span>
      </Command.Item>
      <Command.Item
        value="command|Show Table Name"
        onSelect={() => {
          setShowMode('TABLE_NAME')
          setOpen(false)
        }}
      >
        <RectangleHorizontal className={styles.itemIcon} />
        <span className={styles.itemText}>Show Table Name</span>
      </Command.Item>
      <Command.Item
        value="command|Show Key Only"
        onSelect={() => {
          setShowMode('KEY_ONLY')
          setOpen(false)
        }}
      >
        <KeyRound className={styles.itemIcon} />
        <span className={styles.itemText}>Show Key Only</span>
      </Command.Item>
    </Command.Group>
  )
}
