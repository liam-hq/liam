import {
  Copy,
  KeyRound,
  PanelTop,
  RectangleHorizontal,
  Scan,
  TidyUpIcon,
} from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import { useCommandPaletteInnerOrThrow } from '../CommandPaletteInnerProvider'
import { useCommandPaletteOrThrow } from '../CommandPaletteProvider'
import { suggestionToString } from '../utils'
import styles from './CommandPaletteContent.module.css'

export const CommandOptions: FC = () => {
  const {
    copyLink,
    zoomToFit,
    tidyUp,
    showAllField,
    showTableName,
    showKeyOnly,
  } = useCommandPaletteInnerOrThrow()

  const { setOpen } = useCommandPaletteOrThrow()

  return (
    <Command.Group heading="Command">
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Copy Link' })}
        onSelect={() => {
          copyLink()
          setOpen(false)
        }}
        className={styles.item}
      >
        <Copy className={styles.itemIcon} />
        <span className={styles.itemText}>Copy Link</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>C</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Zoom to Fit' })}
        onSelect={() => {
          zoomToFit()
          setOpen(false)
        }}
        className={styles.item}
      >
        <Scan className={styles.itemIcon} />
        <span className={styles.itemText}>Zoom to Fit</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>F</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Tidy Up' })}
        onSelect={() => {
          tidyUp()
          setOpen(false)
        }}
        className={styles.item}
      >
        <TidyUpIcon className={styles.itemIcon} />
        <span className={styles.itemText}>Tidy Up</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>T</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Show All Fields' })}
        onSelect={() => {
          showAllField()
          setOpen(false)
        }}
        className={styles.item}
      >
        <PanelTop className={styles.itemIcon} />
        <span className={styles.itemText}>Show All Fields</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>1</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Show Table Name' })}
        onSelect={() => {
          showTableName()
          setOpen(false)
        }}
        className={styles.item}
      >
        <RectangleHorizontal className={styles.itemIcon} />
        <span className={styles.itemText}>Show Table Name</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>2</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Show Key Only' })}
        onSelect={() => {
          showKeyOnly()
          setOpen(false)
        }}
        className={styles.item}
      >
        <KeyRound className={styles.itemIcon} />
        <span className={styles.itemText}>Show Key Only</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>3</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Export' })}
        onSelect={() => {}} /* TODO: implement */
        className={styles.item}
      >
        <KeyRound className={styles.itemIcon} />
        <span className={styles.itemText}>Export</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>E</span>
      </Command.Item>
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Undo' })}
        onSelect={() => {}} /* TODO: implement */
        className={styles.item}
      >
        <KeyRound className={styles.itemIcon} />
        <span className={styles.itemText}>Undo</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>Z</span>
      </Command.Item>
    </Command.Group>
  )
}
