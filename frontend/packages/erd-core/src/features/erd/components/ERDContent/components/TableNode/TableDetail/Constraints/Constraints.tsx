import type { Constraints as ConstraintsType } from '@liam-hq/db-structure'
import { Check, Fingerprint, KeyRound, Link, Lock } from '@liam-hq/ui'
import { clsx } from 'clsx'
import type React from 'react'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { CheckConstraintsItem } from './CheckConstraintsItem'
import styles from './Constraints.module.css'
import { ForeignKeyConstraintsItem } from './ForeignKeyConstraintsItem'
import { PrimaryKeyConstraintsItem } from './PrimaryKeyConstraintsItem'
import { UniqueConstraintsItem } from './Unique'

type Props = {
  constraints: ConstraintsType
}

export const Constraints: React.FC<Props> = ({ constraints: _constraints }) => {
  const constraints = Object.values(_constraints)

  const primaryKeyConstraints = constraints.filter(
    (constraint) => constraint.type === 'PRIMARY KEY',
  )
  const foreignKeyConstraints = constraints.filter(
    (constraint) => constraint.type === 'FOREIGN KEY',
  )
  const uniqueConstraints = constraints.filter(
    (constraint) => constraint.type === 'UNIQUE',
  )
  const checkConstraints = constraints.filter(
    (constraint) => constraint.type === 'CHECK',
  )

  // NOTE: 400px is higher enough than each table, even considering titles and padding of its section.
  const contentMaxHeight = constraints.length * 400

  return (
    <CollapsibleHeader
      title="Constraints #"
      icon={<Lock width={12} />}
      isContentVisible={true}
      // NOTE: Header height for Columns and Indexes section:
      // (40px (content) + 1px (border))) * 2 = 82px
      stickyTopHeight={82}
      contentMaxHeight={contentMaxHeight}
    >
      {primaryKeyConstraints.length >= 1 ? (
        <div className={styles.itemWrapper}>
          <h3 className={styles.sectionTitle}>
            <KeyRound
              className={clsx(
                styles.constraintsIcon,
                styles.primaryConstraintsIcon,
              )}
            />
            Primary key
          </h3>
          {primaryKeyConstraints.map((constraint) => (
            <PrimaryKeyConstraintsItem
              key={constraint.name}
              primaryKeyConstraint={constraint}
            />
          ))}
        </div>
      ) : null}
      {foreignKeyConstraints.length >= 1 ? (
        <div className={styles.itemWrapper}>
          <h3 className={styles.sectionTitle}>
            <Link
              className={clsx(
                styles.constraintsIcon,
                styles.primaryConstraintsIcon,
              )}
            />
            Foreign key
          </h3>
          {foreignKeyConstraints.map((constraint) => (
            <ForeignKeyConstraintsItem
              key={constraint.name}
              foreignKeyConstraint={constraint}
            />
          ))}
        </div>
      ) : null}
      {uniqueConstraints.length >= 1 ? (
        <div className={styles.itemWrapper}>
          <h3 className={styles.sectionTitle}>
            <Fingerprint className={styles.constraintsIcon} />
            Unique
          </h3>
          {uniqueConstraints.map((constraint) => (
            <UniqueConstraintsItem
              key={constraint.name}
              uniqueConstraint={constraint}
            />
          ))}
        </div>
      ) : null}
      {checkConstraints.length >= 1 ? (
        <div className={styles.itemWrapper}>
          <h3 className={styles.sectionTitle}>
            <Check className={styles.constraintsIcon} />
            Check
          </h3>
          {checkConstraints.map((constraint) => (
            <CheckConstraintsItem
              key={constraint.name}
              checkConstraint={constraint}
            />
          ))}
        </div>
      ) : null}
    </CollapsibleHeader>
  )
}
