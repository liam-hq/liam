import type { Indices as IndicesType } from '@liam-hq/db-structure'
import { FileText } from '@liam-hq/ui'
import type { FC } from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { IndexesItem } from './IndexesItem'

type Props = {
  indices: IndicesType
}

export const Indices: FC<Props> = ({ indices }) => {
  const contentMaxHeight = Object.keys(indices).length * 400

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
      {Object.entries(indices).map(([key, index]) => (
        <IndexesItem key={key} index={index} />
      ))}
    </CollapsibleHeader>
  )
}
