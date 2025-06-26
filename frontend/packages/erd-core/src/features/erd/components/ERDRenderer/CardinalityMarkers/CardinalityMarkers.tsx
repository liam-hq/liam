import {
  CardinalityZeroOrManyLeftMarker,
  CardinalityZeroOrOneLeftMarker,
  CardinalityZeroOrOneRightMarker,
} from '@liam-hq/ui'
import { type FC, useId } from 'react'
import styles from './CardinalityMarkers.module.css'

export const CardinalityMarkers: FC = () => {
  const zeroOrOneLeftId = useId()
  const zeroOrOneLeftHighlightId = useId()
  const zeroOrOneRightId = useId()
  const zeroOrOneRightHighlightId = useId()
  const zeroOrManyLeftId = useId()
  const zeroOrManyLeftHighlightId = useId()

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
