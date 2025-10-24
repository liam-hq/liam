import { DrawerContent, DrawerPortal, DrawerRoot } from '@liam-hq/ui'
import { err, ok, type Result } from 'neverthrow'
import {
  createContext,
  type FC,
  type PropsWithChildren,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { useSchemaOrThrow, useUserEditingOrThrow } from '../../../../../stores'
import { TableDetail } from '../../ERDContent/components/TableNode/TableDetail'
import styles from './TableDetailDrawer.module.css'

type TableDetailDrawerContextValue = {
  drawerRef: RefObject<HTMLDivElement | null>
}

const TableDetailDrawerContext =
  createContext<TableDetailDrawerContextValue | null>(null)

const useTableDetailDrawerContext = (): Result<
  TableDetailDrawerContextValue,
  Error
> => {
  const context = useContext(TableDetailDrawerContext)
  if (!context) {
    return err(
      new Error(
        'useTableDetailDrawerContext must be used within TableDetailDrawerRoot',
      ),
    )
  }
  return ok(context)
}

const useTableDetailDrawerContextOrThrow =
  (): TableDetailDrawerContextValue => {
    const result = useTableDetailDrawerContext()
    if (result.isErr()) throw result.error

    return result.value
  }

export const TableDetailDrawerRoot: FC<PropsWithChildren> = ({ children }) => {
  const { activeTableName, setActiveTableName } = useUserEditingOrThrow()
  const drawerRef = useRef<HTMLDivElement>(null)

  const { current } = useSchemaOrThrow()
  const open =
    Object.keys(current.tables).length > 0 && activeTableName !== undefined

  const handleClose = useCallback(() => {
    setActiveTableName(null)
  }, [setActiveTableName])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return
      }

      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target) &&
        open
      ) {
        event.preventDefault()
        event.stopPropagation()

        handleClose()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [open, handleClose])

  return (
    <TableDetailDrawerContext.Provider value={{ drawerRef }}>
      <DrawerRoot
        direction="right"
        // Set snapPoints to an empty array to disable the drawer snapping functionality.
        // This behavior is an undocumented, unofficial usage and might change in the future.
        // ref: https://github.com/emilkowalski/vaul/blob/main/src/use-snap-points.ts
        snapPoints={[]}
        open={open}
        onClose={handleClose}
        modal={false}
      >
        {children}
      </DrawerRoot>
    </TableDetailDrawerContext.Provider>
  )
}

export const TableDetailDrawer: FC = () => {
  const { drawerRef } = useTableDetailDrawerContextOrThrow()
  const { current, merged } = useSchemaOrThrow()
  const { showDiff, activeTableName } = useUserEditingOrThrow()

  const schema = useMemo(() => {
    return showDiff && merged ? merged : current
  }, [showDiff, merged, current])

  const table = schema.tables[activeTableName ?? '']
  const ariaDescribedBy =
    table?.comment == null
      ? {
          'aria-describedby': undefined,
        }
      : {}

  return (
    <DrawerPortal>
      {table !== undefined && (
        <DrawerContent
          ref={drawerRef}
          className={styles.content}
          {...ariaDescribedBy}
        >
          <TableDetail
            // rerender TableDetail when target table changes
            key={table.name}
            table={table}
          />
        </DrawerContent>
      )}
    </DrawerPortal>
  )
}
