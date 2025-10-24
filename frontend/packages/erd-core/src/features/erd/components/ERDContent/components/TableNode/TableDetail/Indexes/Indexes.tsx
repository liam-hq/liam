import type { Indexes as IndexesType } from '@liam-hq/schema'
import { FileText } from '@liam-hq/ui'
import { type FC, useEffect, useState } from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { IndexesItem } from './IndexesItem'

type Props = {
  tableId: string
  indexes: IndexesType
}

export const Indexes: FC<Props> = ({ tableId, indexes }) => {
  const [focusedElementId, setFocusedElementId] = useState(
    // location.hash starts with '#'; decode to match actual DOM id
    location.hash.slice(1),
  )

  // update focusedElementId when hash changes
  useEffect(() => {
    const updateState = () => {
      const elementId = location.hash.slice(1)
      setFocusedElementId(elementId)
    }

    window.addEventListener('hashchange', updateState)
    return () => window.removeEventListener('hashchange', updateState)
  }, [])

  const contentMaxHeight = Object.keys(indexes).length * 400

  return (
    <CollapsibleHeader
      title="Indexes #"
      icon={<FileText width={12} />}
      isContentVisible={true}
      // NOTE: Header height for Columns section:
      // 40px (content) + 1px (border) = 41px
      stickyTopHeight={41}
      contentMaxHeight={contentMaxHeight}
    >
      {Object.entries(indexes).map(([key, index]) => (
        <IndexesItem
          key={key}
          tableId={tableId}
          index={index}
          focusedElementId={focusedElementId}
        />
      ))}
    </CollapsibleHeader>
  )
}
