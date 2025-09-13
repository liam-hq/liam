import type { Indexes as IndexesType } from '@liam-hq/schema'
import { FileText } from '@liam-hq/ui'
import { type FC, useCallback } from 'react'
import { useUserEditingOrThrow } from '../../../../../../../../stores'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { IndexesItem } from './IndexesItem'

type Props = {
  tableId: string
  indexes: IndexesType
}

export const Indexes: FC<Props> = ({ tableId, indexes }) => {
  const contentMaxHeight = Object.keys(indexes).length * 400

  const { setHash } = useUserEditingOrThrow()
  const scrollToHeader = useCallback(() => {
    const headerId = `${tableId}__indexes`
    document.getElementById(headerId)?.scrollIntoView()
    setTimeout(() => setHash(`#${headerId}`), 0)
  }, [tableId, setHash])

  return (
    <CollapsibleHeader
      title="Indexes"
      headerId={`${tableId}__indexes`}
      scrollToHeader={scrollToHeader}
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
