import { Link } from '@liam-hq/ui'
import clsx from 'clsx'
import type { ComponentProps, FC } from 'react'
import { BlinkCircle } from '../../BlinkCircle/BlinkCircle'
import { CollapsibleHeaderItem } from '../CollapsibleHeader'
import styles from './DetailItem.module.css'

type Props = ComponentProps<'div'> & { isFocused: boolean }

export const DetailItem: FC<Props> = ({ isFocused, className, ...props }) => (
  <>
    {isFocused && (
      <div
        className={styles.blinkCircleWrapper}
        data-testid="blink-circle-indicator"
      >
        <BlinkCircle />
      </div>
    )}
    <CollapsibleHeaderItem
      className={clsx(styles.container, className, isFocused && styles.focused)}
      {...props}
    />
  </>
)

type HeadingProps = ComponentProps<'a'>

export const DetailItemHeading: FC<HeadingProps> = (props) => (
  <h3 className={styles.heading}>
    <a className={styles.link} {...props} />
    <Link className={styles.linkIcon} />
  </h3>
)
