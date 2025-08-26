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
import { useUserEditingOrThrow } from '@/stores'
import { useCommandPaletteOrThrow } from '../CommandPaletteProvider'
import { useCopyLink } from '../hooks/useCopyLink'
import { useFitScreen } from '../hooks/useFitScreen'
import { getSuggestionText } from '../utils'
import styles from './CommandPaletteOptions.module.css'

export const CommandPaletteCommandOptions: FC = () => {
  const { copyLink } = useCopyLink('command-palette')
  const { zoomToFit, tidyUp } = useFitScreen()
  const { setShowMode } = useUserEditingOrThrow()

  const { setOpen } = useCommandPaletteOrThrow()

  return (
    <Command.Group heading="Commands">
      <Command.Item
        className={styles.item}
        value={getSuggestionText({ type: 'command', name: 'copy link' })}
        onSelect={() => {
          copyLink()
          setOpen(false)
        }}
      >
        <Copy className={styles.itemIcon} />
        <span className={styles.itemText}>Copy Link</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>C</span>
      </Command.Item>
      <Command.Item
        value={getSuggestionText({ type: 'command', name: 'Zoom to Fit' })}
        onSelect={() => {
          zoomToFit()
          setOpen(false)
        }}
        className={styles.item}
      >
        <Scan className={styles.itemIcon} />
        <span className={styles.itemText}>Zoom to Fit</span>
        <span className={styles.keyIcon}>⇧</span>
        <span className={styles.keyIcon}>1</span>
      </Command.Item>
      <Command.Item
        value={getSuggestionText({ type: 'command', name: 'Tidy Up' })}
        onSelect={() => {
          tidyUp()
          setOpen(false)
        }}
        className={styles.item}
      >
        <TidyUpIcon className={styles.itemIcon} />
        <span className={styles.itemText}>Tidy Up</span>
        <span className={styles.keyIcon}>⇧</span>
        <span className={styles.keyIcon}>T</span>
      </Command.Item>
      <Command.Item
        value={getSuggestionText({ type: 'command', name: 'Show All Fields' })}
        onSelect={() => {
          setShowMode('ALL_FIELDS')
          setOpen(false)
        }}
        className={styles.item}
      >
        <PanelTop className={styles.itemIcon} />
        <span className={styles.itemText}>Show All Fields</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>2</span>
      </Command.Item>
      <Command.Item
        value={getSuggestionText({ type: 'command', name: 'Show Table Name' })}
        onSelect={() => {
          setShowMode('TABLE_NAME')
          setOpen(false)
        }}
        className={styles.item}
      >
        <RectangleHorizontal className={styles.itemIcon} />
        <span className={styles.itemText}>Show Table Name</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>3</span>
      </Command.Item>
      <Command.Item
        value={getSuggestionText({ type: 'command', name: 'Show Key Only' })}
        onSelect={() => {
          setShowMode('KEY_ONLY')
          setOpen(false)
        }}
        className={styles.item}
      >
        <KeyRound className={styles.itemIcon} />
        <span className={styles.itemText}>Show Key Only</span>
        <span className={styles.keyIcon}>⌘</span>
        <span className={styles.keyIcon}>4</span>
      </Command.Item>
    </Command.Group>
  )
}
