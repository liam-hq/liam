import {
  Copy,
  KeyRound,
  PanelTop,
  RectangleHorizontal,
  Scan,
  TidyUpIcon,
} from '@liam-hq/ui'
import { useReactFlow } from '@xyflow/react'
import { Command } from 'cmdk'
import { type FC, useCallback } from 'react'
import { computeAutoLayout } from '@/features/erd/utils'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersionOrThrow } from '@/providers'
import { useUserEditingOrThrow } from '@/stores'
import { useCommandPalette } from '../CommandPaletteProvider'
import { suggestionToString } from '../utils'
import styles from './CommandPaletteContent.module.css'

export const CommandOptions: FC = () => {
  const commandPaletteResult = useCommandPalette()
  if (commandPaletteResult.isErr()) {
    throw commandPaletteResult.error
  }
  const { setOpen } = commandPaletteResult.value

  // for "Zoom to Fit"
  const { fitView } = useCustomReactflow()
  const { showMode } = useUserEditingOrThrow()
  const { version } = useVersionOrThrow()
  const handleZoomToFit = useCallback(() => {
    toolbarActionLogEvent({
      element: 'fitview',
      showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
    fitView()
  }, [fitView, showMode, version])

  // for "Tidy Up"
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const handleTidyUp = useCallback(async () => {
    toolbarActionLogEvent({
      element: 'tidyUp',
      showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
    const { nodes } = await computeAutoLayout(getNodes(), getEdges())
    setNodes(nodes)
    fitView()
  }, [showMode, getNodes, getEdges, setNodes, fitView, version])

  // for "Show All Fields" / "Show Table Name" / Show Key Only""
  const { setShowMode } = useUserEditingOrThrow()

  return (
    <Command.Group heading="Command">
      <Command.Item
        value={suggestionToString({ type: 'command', name: 'Copy Link' })}
        onSelect={() => navigator.clipboard.writeText(location.href)}
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
          handleZoomToFit()
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
          handleTidyUp()
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
          setShowMode('ALL_FIELDS')
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
          setShowMode('TABLE_NAME')
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
          setShowMode('KEY_ONLY')
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
