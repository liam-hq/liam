import {
  CardinalityZeroOrManyLeftMarker,
  CardinalityZeroOrOneLeftMarker,
  CardinalityZeroOrOneRightMarker,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './CardinalityMarkers.module.css'

type Props = {
  zeroOrOneLeftId: string
  zeroOrOneLeftHighlightId: string
  zeroOrOneRightId: string
  zeroOrOneRightHighlightId: string
  zeroOrManyLeftId: string
  zeroOrManyLeftHighlightId: string
}

export const CardinalityMarkers: FC<Props> = ({
  zeroOrOneLeftId,
  zeroOrOneLeftHighlightId,
  zeroOrOneRightId,
  zeroOrOneRightHighlightId,
  zeroOrManyLeftId,
  zeroOrManyLeftHighlightId,
}) => {
  return (
    <div className={styles.wrapper}>
      <CardinalityZeroOrOneLeftMarker
        id={zeroOrOneLeftId}
        color="var(--pane-border-hover)"
      />
      <CardinalityZeroOrOneLeftMarker
        id={zeroOrOneLeftHighlightId}
        isHighlighted={true}
        color="var(--node-layout)"
      />
      <CardinalityZeroOrOneRightMarker
        id={zeroOrOneRightId}
        color="var(--pane-border-hover)"
      />
      <CardinalityZeroOrOneRightMarker
        id={zeroOrOneRightHighlightId}
        isHighlighted={true}
        color="var(--node-layout)"
      />
      <CardinalityZeroOrManyLeftMarker
        id={zeroOrManyLeftId}
        color="var(--pane-border-hover)"
      />
      <CardinalityZeroOrManyLeftMarker
        id={zeroOrManyLeftHighlightId}
        isHighlighted={true}
        color="var(--node-layout)"
      />
    </div>
  )
}
