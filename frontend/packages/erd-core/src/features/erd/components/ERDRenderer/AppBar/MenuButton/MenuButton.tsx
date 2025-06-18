import { Menu, useSidebar, XIcon } from '@liam-hq/ui'
import { type Ref, useCallback } from 'react'
import styles from './MenuButton.module.css'

type Props = {
  ref?: Ref<HTMLButtonElement>
}

export const MenuButton = ({ ref }: Props) => {
  const { open, toggleSidebar } = useSidebar()

  const handleClick = useCallback(() => {
    toggleSidebar()
  }, [toggleSidebar])

  return (
    <button
      ref={ref}
      type="button"
      className={styles.wrapper}
      onClick={handleClick}
    >
      {open ? (
        <XIcon className={styles.icon} />
      ) : (
        <Menu className={styles.icon} />
      )}
    </button>
  )
}
MenuButton.displayName = 'MenuButton'
