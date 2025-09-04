import type { ChangeStatus } from '@liam-hq/schema'
import { useMemo } from 'react'
import { match } from 'ts-pattern'
import diffStyles from '../styles/Diff.module.css'

export const useDiffStyle = (
  showDiff: boolean,
  changeStatus: ChangeStatus | undefined,
): string | undefined => {
  return useMemo(() => {
    if (!showDiff || !changeStatus) return undefined
    return match(changeStatus)
      .with('added', () => diffStyles.addedBg)
      .with('removed', () => diffStyles.removedBg)
      .with('modified', () => diffStyles.modifiedBg)
      .otherwise(() => undefined)
  }, [showDiff, changeStatus])
}
