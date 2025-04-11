import { clsx } from 'clsx'
import type React from 'react'
import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
import styles from './GridTable.module.css'

type GridTableRootProps = ComponentProps<'dl'>
export const GridTableRoot = forwardRef<HTMLDListElement, GridTableRootProps>(
  (props, ref) => <dl ref={ref} className={styles.root} {...props} />,
)

type GridTableHeaderProps = ComponentProps<'dt'>
export const GridTableHeader = forwardRef<HTMLElement, GridTableHeaderProps>(
  (props, ref) => (
    <div className={styles.dlItem}>
      <dt ref={ref} className={styles.dtHeader} {...props} />
    </div>
  ),
)

type GridTableItemProps = ComponentProps<'div'>
export const GridTableItem = forwardRef<HTMLDivElement, GridTableItemProps>(
  (props, ref) => <div ref={ref} className={styles.dlItem} {...props} />,
)

type GridTableDtProps = ComponentProps<'dt'>
export const GridTableDt = forwardRef<HTMLElement, GridTableDtProps>(
  (props, ref) => <dt ref={ref} className={styles.dt} {...props} />,
)

type GridTableDdProps = ComponentProps<'dd'>
export const GridTableDd = forwardRef<HTMLElement, GridTableDdProps>(
  (props, ref) => <dd ref={ref} className={styles.dd} {...props} />,
)

type GridTableRowProps = ComponentProps<'dt'>
export const GridTableRow = forwardRef<HTMLElement, GridTableRowProps>(
  (props, ref) => (
    <dt ref={ref} className={clsx(styles.dt, styles.row)} {...props} />
  ),
)
