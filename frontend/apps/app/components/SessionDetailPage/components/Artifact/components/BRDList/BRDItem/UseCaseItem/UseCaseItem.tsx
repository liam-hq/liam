import type { FC } from 'react'
import type { UseCase } from '../../types'
import { ExecutableDMLBlock } from './ExecutableDMLBlock'
import styles from './UseCaseItem.module.css'

type Props = {
  item: UseCase
}

export const UseCaseItem: FC<Props> = ({ item }) => {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>
        <span className={styles.id}>{item.id}</span>
        {item.name}
      </h3>
      <div className={styles.body}>
        {item.steps && (
          <ol className={styles.stepList}>
            {item.steps.map((step) => (
              <li key={step.order} className={styles.stepItem}>
                <div className={styles.orderAndDescription}>
                  <span className={styles.stepOrder}>{step.order}</span>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
                {step.dmlBlocks && step.dmlBlocks.length > 0 && (
                  <div className={styles.dmlBlockList}>
                    {step.dmlBlocks.map((block) => (
                      <ExecutableDMLBlock key={block.name} dmlBlock={block} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
