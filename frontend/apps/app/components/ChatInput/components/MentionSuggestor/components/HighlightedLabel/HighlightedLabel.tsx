import type { FC } from 'react'
import { getHighlightedParts } from './getHighlightedParts'
import styles from './HighlightedLabel.module.css'

type Props = {
  label: string
  query: string
}

export const HighlightedLabel: FC<Props> = ({ label, query }) => {
  const { before, match, after } = getHighlightedParts(label, query)

  return (
    <>
      {before}
      {match && <span className={styles.highlight}>{match}</span>}
      {after}
    </>
  )
}
