import { DrawerContent, DrawerPortal, DrawerRoot } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, type PropsWithChildren, useCallback, useMemo } from 'react'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { TableDetail } from '../../ERDContent/components/TableNode/TableDetail'
import styles from './TableDetailDrawer.module.css'

export const TableDetailDrawerRoot: FC<
  PropsWithChildren<{ withAppBar?: boolean }>
> = ({ children, withAppBar: _withAppBar = false }) => {
  const { activeTableName, setActiveTableName } = useUserEditingOrThrow()

  const { current } = useSchemaOrThrow()
  const open =
    Object.keys(current.tables).length > 0 && activeTableName !== undefined

  const handleClose = useCallback(() => {
    setActiveTableName(null)
  }, [setActiveTableName])

  return (
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
  )
}

export const TableDetailDrawer: FC<{ withAppBar?: boolean }> = ({
  withAppBar = false,
}) => {
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
          className={clsx(
            styles.content,
            !withAppBar && styles.contentNoHeader,
          )}
          {...ariaDescribedBy}
        >
          <TableDetail table={table} />
        </DrawerContent>
      )}
    </DrawerPortal>
  )
}
