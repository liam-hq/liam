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
      <CardinalityZeroOrOneLeftMarker
        id="zeroOrOneLeft"
        color="var(--pane-border-hover)"
      />
      <CardinalityZeroOrOneLeftMarker
        id="zeroOrOneLeftHighlight"
        isHighlighted={true}
        color="var(--node-layout)"
      />
      <CardinalityZeroOrOneRightMarker
        id="zeroOrOneRight"
        color="var(--pane-border-hover)"
      />
      <CardinalityZeroOrOneRightMarker
        id="zeroOrOneRightHighlight"
        isHighlighted={true}
        color="var(--node-layout)"
      />
      <CardinalityZeroOrManyLeftMarker
        id="zeroOrManyLeft"
        color="var(--pane-border-hover)"
      />
      <CardinalityZeroOrManyLeftMarker
        id="zeroOrManyLeftHighlight"
        isHighlighted={true}
        color="var(--node-layout)"
      />
    </div>
  )
}
