import {
  CardinalityZeroOrManyLeftMarker,
  CardinalityZeroOrOneLeftMarker,
  CardinalityZeroOrOneRightMarker,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './CardinalityMarkers.module.css'

export const CardinalityMarkers: FC = () => {
  return (
    <div className={styles.wrapper}>
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      <CardinalityZeroOrOneLeftMarker
        id="zeroOrOneLeft"
        color="var(--pane-border-hover)"
      />
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      <CardinalityZeroOrOneLeftMarker
        id="zeroOrOneLeftHighlight"
        isHighlighted={true}
        color="var(--node-layout)"
      />
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      <CardinalityZeroOrOneRightMarker
        id="zeroOrOneRight"
        color="var(--pane-border-hover)"
      />
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      <CardinalityZeroOrOneRightMarker
        id="zeroOrOneRightHighlight"
        isHighlighted={true}
        color="var(--node-layout)"
      />
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      <CardinalityZeroOrManyLeftMarker
        id="zeroOrManyLeft"
        color="var(--pane-border-hover)"
      />
      {/* biome-ignore lint/nursery/useUniqueElementIds: TODO: Review and use dynamic ID generation with useId() hook */}
      <CardinalityZeroOrManyLeftMarker
        id="zeroOrManyLeftHighlight"
        isHighlighted={true}
        color="var(--node-layout)"
      />
    </div>
  )
}
