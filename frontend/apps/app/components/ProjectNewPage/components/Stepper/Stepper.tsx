import clsx from 'clsx'
import type { FC } from 'react'
import { StepArrow } from './StepArrow'
import styles from './Stepper.module.css'

export type Step = {
  label: string
}

type Props = {
  steps: Step[]
  activeIndex?: number
}

export const Stepper: FC<Props> = ({ steps, activeIndex = 0 }) => {
  return (
    <ol className={styles.wrapper}>
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={clsx(
            styles.step,
            index === activeIndex && styles.stepActive,
          )}
        >
          <div className={styles.content}>
            <span
              className={clsx(
                styles.stepBadge,
                index === activeIndex && styles.stepBadgeActive,
              )}
            >
              {index + 1}
            </span>
            <span
              className={clsx(
                styles.stepLabel,
                index === activeIndex && styles.stepLabelActive,
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && <StepArrow />}
        </li>
      ))}
    </ol>
  )
}
