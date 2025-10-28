import type { FC } from 'react'
import type { ArtifactGenerationPhase } from '../utils/getArtifactGenerationStatus'
import styles from './GenerationStatus.module.css'

type Props = {
  phase: ArtifactGenerationPhase
}

const getStatusText = (phase: ArtifactGenerationPhase): string => {
  switch (phase) {
    case 'analyzing_requirements':
      return 'Analyzing requirements...'
    case 'generating_testcases':
      return 'Generating test cases...'
    case 'generating_sql':
      return 'Generating SQL...'
    case 'executing_tests':
      return 'Executing tests...'
    case 'completed':
      return 'Generation completed'
    default:
      return 'Processing...'
  }
}

export const GenerationStatus: FC<Props> = ({ phase }) => {
  if (!phase) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <span className={styles.statusText}>{getStatusText(phase)}</span>
    </div>
  )
}
