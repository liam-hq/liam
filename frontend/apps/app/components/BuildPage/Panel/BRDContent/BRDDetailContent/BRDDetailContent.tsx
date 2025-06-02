import type { FC } from 'react'
import styles from './BRDDetailContent.module.css'

export type BusinessRequirement = {
  id: string
  title: string
  description: string
}

type Props = {
  brd: BusinessRequirement
}

export const BRDDetailContent: FC<Props> = ({ brd }) => {
  return (
    <div className={styles.brdDetail}>
      <div className={styles.detailHeader}>
        <div className={styles.detailId}>{brd.id}</div>
        <div className={styles.detailTitle}>{brd.title}</div>
      </div>
      <div className={styles.detailContent}>
        <h3 className={styles.sectionTitle}>Overview</h3>
        <p className={styles.detailDescription}>{brd.description}</p>

        <h3 className={styles.sectionTitle}>Detailed Specifications</h3>
        <div className={styles.specificationContent}>
          <p>
            Detailed specifications for this business requirement will be
            described here.
          </p>
          <ul className={styles.specList}>
            <li>Detailed functional requirements</li>
            <li>Non-functional requirements</li>
            <li>Constraints</li>
            <li>Acceptance criteria</li>
          </ul>
        </div>

        <h3 className={styles.sectionTitle}>Technical Components</h3>
        <div className={styles.techContent}>
          <p>
            Technical elements and considerations needed to implement this
            requirement.
          </p>
        </div>
      </div>
    </div>
  )
}
