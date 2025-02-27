import {
  Dot,
  Minus,
  Plus,
  Table2,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import { AFTER_DB, BEFORE_DB } from '../../constants'
import { generateMigrationOperations } from '../../utils'
import type { Data } from '../TableNode'
import styles from './TableHeader.module.css'

type Props = {
  data: Data
}

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name

  const diff = generateMigrationOperations(BEFORE_DB, AFTER_DB)
  const matchedDiff = diff.filter((d) => {
    return match(d)
      .with({ type: 'table-add' }, (d) => d.table.name === data.table.name)
      .with({ type: 'table-remove' }, (d) => d.tableName === data.table.name)
      .otherwise(() => false)
  })

  return (
    <div className={styles.wrapper}>
      <div
        className={clsx(styles.box, {
          [styles.bgGreen]: matchedDiff.some(
            (d) => d.type === 'column-add' || d.type === 'table-add',
          ),
          [styles.bgRed]: matchedDiff.some(
            (d) => d.type === 'column-remove' || d.type === 'table-remove',
          ),
          [styles.bgYellow]: matchedDiff.some(
            (d) => d.type === 'column-rename',
          ),
        })}
      >
        {matchedDiff.some(
          (d) => d.type === 'column-add' || d.type === 'table-add',
        ) && <Plus color="#1DED83" width="0.75rem" height="0.75rem" />}
        {matchedDiff.some(
          (d) => d.type === 'column-remove' || d.type === 'table-remove',
        ) && <Minus color="#F75049" width="0.75rem" height="0.75rem" />}
        {matchedDiff.some((d) => d.type === 'column-rename') && (
          <Dot color="#FFD748" width="0.75rem" height="0.75rem" />
        )}
      </div>
      <div
        className={clsx(styles.container, {
          [styles.bgGreen]: matchedDiff.some(
            (d) => d.type === 'column-add' || d.type === 'table-add',
          ),
          [styles.bgRed]: matchedDiff.some(
            (d) => d.type === 'column-remove' || d.type === 'table-remove',
          ),
          [styles.bgYellow]: matchedDiff.some(
            (d) => d.type === 'column-rename',
          ),
        })}
      >
        <Table2 width={16} className={styles.tableIcon} />

        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <span className={styles.name}>{name}</span>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="top" sideOffset={4}>
                {name}
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </div>
    </div>
  )
}
