import type { Schema as ERDSchema } from '@liam-hq/db-structure'
import { Ellipsis } from '@liam-hq/ui'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ComponentType, FC } from 'react'
import styles from './MobileToolbar.module.css'
import { OpenedMobileToolbar } from './OpenedMobileToolbar'
import { ShowModeMenu } from './ShowModeMenu'

interface TableGroupData {
  name?: string
  tables?: string[]
  comment?: string | null
}

interface ChatbotButtonProps {
  schemaData: ERDSchema
  tableGroups?: Record<string, TableGroupData>
}

type MobileToolbarProps = {
  withGroupButton?: ComponentProps<
    typeof OpenedMobileToolbar
  >['withGroupButton']
  schemaData?: ERDSchema
  tableGroups?: Record<string, TableGroupData>
  ChatbotButtonComponent?: ComponentType<ChatbotButtonProps>
}

export const MobileToolbar: FC<MobileToolbarProps> = ({
  withGroupButton = false,
  schemaData,
  tableGroups,
  ChatbotButtonComponent,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isShowModeMenu, setIsShowModeMenu] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const toggleOpenClose = () => {
    setIsOpen((prev) => !prev)
  }

  const toggleShowModeMenu = () => {
    setIsShowModeMenu((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return
      }

      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target) &&
        isOpen
      ) {
        event.preventDefault()
        event.stopPropagation()

        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [isOpen])

  return (
    <>
      {isOpen && <div className={styles.overlay} />}
      <ToolbarPrimitive.Root
        ref={toolbarRef}
        className={clsx(styles.root, {
          [styles.closed]: !isOpen,
          [styles.open]: isOpen && !isShowModeMenu,
          [styles.openShowModeMenu]: isOpen && isShowModeMenu,
        })}
        aria-label="Toolbar"
      >
        <div className={styles.positionRelative}>
          {/* Default(closed) */}
          <div
            className={clsx(
              styles.content,
              !isOpen ? clsx(styles.active, styles.ellipsis) : styles.hidden,
            )}
          >
            <button
              type="button"
              onClick={toggleOpenClose}
              aria-label="Open toolbar"
            >
              <Ellipsis color="var(--global-foreground)" />
            </button>
          </div>

          {/* Open */}
          <div
            className={clsx(
              styles.content,
              isOpen && !isShowModeMenu ? styles.active : styles.hidden,
            )}
          >
            <OpenedMobileToolbar
              withGroupButton={withGroupButton}
              toggleOpenClose={toggleOpenClose}
              toggleShowModeMenu={toggleShowModeMenu}
              schemaData={schemaData}
              tableGroups={tableGroups}
              ChatbotButtonComponent={ChatbotButtonComponent}
            />
          </div>

          {/* ShowModeMenu */}
          <div
            className={clsx(
              styles.content,
              isOpen && isShowModeMenu ? styles.active : styles.hidden,
            )}
          >
            <ShowModeMenu
              toggleOpenClose={toggleOpenClose}
              toggleShowModeMenu={toggleShowModeMenu}
            />
          </div>
        </div>
      </ToolbarPrimitive.Root>
    </>
  )
}
