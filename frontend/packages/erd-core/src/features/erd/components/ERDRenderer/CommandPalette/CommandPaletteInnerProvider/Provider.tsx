import { useReactFlow } from '@xyflow/react'
import { type FC, type PropsWithChildren, useCallback, useEffect } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { computeAutoLayout } from '@/features/erd/utils'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersionOrThrow } from '@/providers'
import { useUserEditingOrThrow } from '@/stores'
import { CommandPaletteInnerContext } from './context'

type Props = PropsWithChildren

export const CommandPaletteInnerProvider: FC<Props> = ({ children }) => {
  const { selectTable } = useTableSelection()
  const { fitView } = useCustomReactflow()
  const { showMode, setShowMode } = useUserEditingOrThrow()
  const { version } = useVersionOrThrow()

  const goToERD = useCallback(
    (tableName: string) => {
      selectTable({ tableId: tableName, displayArea: 'main' })
    },
    [selectTable],
  )

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(location.href)
  }, [])

  const zoomToFit = useCallback(() => {
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
  const tidyUp = useCallback(async () => {
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

  const showAllField = useCallback(() => {
    setShowMode('ALL_FIELDS')
  }, [])
  const showTableName = useCallback(() => {
    setShowMode('TABLE_NAME')
  }, [])
  const showKeyOnly = useCallback(() => {
    setShowMode('KEY_ONLY')
  }, [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) {
        return
      }

      if (event.key === 'c') {
        copyLink()
      } else if (event.key === 'f') {
        zoomToFit()
      } else if (event.key === 't') {
        tidyUp()
      } else if (event.key === '1') {
        showAllField()
      } else if (event.key === '2') {
        showTableName()
      } else if (event.key === '3') {
        showKeyOnly()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [copyLink, zoomToFit, tidyUp, showAllField, showTableName, showKeyOnly])

  return (
    <CommandPaletteInnerContext.Provider
      value={{
        goToERD,
        copyLink,
        zoomToFit,
        tidyUp,
        showAllField,
        showTableName,
        showKeyOnly,
      }}
    >
      {children}
    </CommandPaletteInnerContext.Provider>
  )
}
