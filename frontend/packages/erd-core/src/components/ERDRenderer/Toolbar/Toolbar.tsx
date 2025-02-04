import { useSidebar } from '@liam-hq/ui'
import clsx from 'clsx'
import type { FC } from 'react'
import { DesktopToolbar } from './DesktopToolbar'
import { MobileToolbar } from './MobileToolbar'
import styles from './Toolbar.module.css'

export const Toolbar: FC = () => {
  const { state } = useSidebar()
  const isExpanded = state === 'expanded'

  return (
    <div
      className={clsx(styles.wrapper, {
        [styles.wrapperWithSidebar]: isExpanded,
      })}
    >
      <MobileToolbar />
      <DesktopToolbar />
    </div>
  )
}
