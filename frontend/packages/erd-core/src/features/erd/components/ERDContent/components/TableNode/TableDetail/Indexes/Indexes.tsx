import type { Indexes as IndexesType } from '@liam-hq/schema'
import { FileText } from '@liam-hq/ui'
import type { FC } from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { IndexesItem } from './IndexesItem'

type Props = {
  tableId: string
  indexes: IndexesType
}

export const Indexes: FC<Props> = ({ tableId, indexes }) => {
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
        <IndexesItem key={key} tableId={tableId} index={index} />
      ))}
    </CollapsibleHeader>
  )
}
