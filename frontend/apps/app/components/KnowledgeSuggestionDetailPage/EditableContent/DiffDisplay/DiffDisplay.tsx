import * as diffLib from 'diff'
import type { FC } from 'react'
import styles from './DiffDisplay.module.css'

interface DiffDisplayProps {
  originalContent: string | null
  newContent: string
}

export const DiffDisplay: FC<DiffDisplayProps> = ({
  originalContent,
  newContent,
}) => {
  if (!originalContent) {
    return (
      <div className={styles.diffContent}>
        {newContent.split('\n').map((line, index) => (
          <div
            key={`added-${line}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              index
            }`}
            className={styles.diffAdded}
          >
            + {line}
          </div>
        ))}
      </div>
    )
  }

  const diff = diffLib.diffTrimmedLines(originalContent, newContent)

  return (
    <div className={styles.diffContent}>
      {diff.map((part, index) => {
        const className = part.added
          ? styles.diffAdded
          : part.removed
            ? styles.diffRemoved
            : styles.diffUnchanged

        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '

        return part.value.split('\n').map((line, lineIndex) => {
          if (lineIndex === part.value.split('\n').length - 1 && line === '') {
            return null
          }
          return (
            <div
              key={`${part.added ? 'added' : part.removed ? 'removed' : 'unchanged'}-${index}-${lineIndex}`}
              className={className}
            >
              {prefix}
              {line}
            </div>
          )
        })
      })}
    </div>
  )
}
