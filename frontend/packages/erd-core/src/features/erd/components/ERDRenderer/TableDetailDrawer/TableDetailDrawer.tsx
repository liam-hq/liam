import {
  updateActiveTableName,
  useDBStructureStore,
  useUserEditingActiveStore,
} from '@/stores'
import { DrawerContent, DrawerPortal, DrawerRoot } from '@liam-hq/ui'
import type { FC, PropsWithChildren } from 'react'
import { TableDetail } from '../../ERDContent/components/TableNode/TableDetail'
import styles from './TableDetailDrawer.module.css'

const handleClose = () => updateActiveTableName(undefined)

export const TableDetailDrawerRoot: FC<PropsWithChildren> = ({ children }) => {
  const { tableName } = useUserEditingActiveStore()
  const { tables } = useDBStructureStore()
  const open = Object.keys(tables).length > 0 && tableName !== undefined

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

export const TableDetailDrawer: FC = () => {
  const { tables } = useDBStructureStore()
  const { tableName } = useUserEditingActiveStore()
  const table = tables[tableName ?? '']
  const ariaDescribedBy =
    table?.comment == null
      ? {
          'aria-describedby': undefined,
        }
      : {}

  return (
    <DrawerPortal>
      <DrawerContent className={styles.content} {...ariaDescribedBy}>
        {table !== undefined && <TableDetail table={table} />}
      </DrawerContent>
    </DrawerPortal>
  )
}
