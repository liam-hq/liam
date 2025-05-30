import type { TableNodeType } from '@/features/erd/types'
import { useIsTouchDevice } from '@/hooks'
import { useUserEditingStore } from '@/stores'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { type FC, useEffect, useRef, useState } from 'react'
import { TableColumnList } from './TableColumnList'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ data }) => {
  const isMobile = useIsTouchDevice()
  const { showMode: _showMode } = useUserEditingStore()
  const showMode = data.showMode ?? _showMode
  const name = data?.table?.name

  const [isTruncated, setIsTruncated] = useState<boolean>(false)
  const textRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const measureText = () => {
      // Create a range to measure the text
      const range = document.createRange()
      range.selectNodeContents(element)

      // Get the text width using getBoundingClientRect
      const textWidth = range.getBoundingClientRect().width
      const containerWidth = element.getBoundingClientRect().width

      // Add a small threshold (0.016px) to account for subpixel rendering
      setIsTruncated(textWidth > containerWidth + 0.016)
    }

    measureText()

    // Set up ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(() => {
      measureText()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <div
            className={clsx(
              styles.wrapper,
              data.isHighlighted && styles.wrapperHighlighted,
              data.isActiveHighlighted && styles.wrapperActive,
            )}
            data-erd={
              (data.isHighlighted || data.isActiveHighlighted) &&
              'table-node-highlighted'
            }
          >
            {isMobile ? (
              <TableHeader data={data}/>
            ) : (
              <TableHeader data={data} textRef={textRef} />
            )}
            {showMode === 'ALL_FIELDS' && <TableColumnList data={data} />}
            {showMode === 'KEY_ONLY' && (
              <TableColumnList data={data} filter="KEY_ONLY" />
            )}
          </div>
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent side={'top'} sideOffset={4} hidden={!isTruncated}>
            {name}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}
