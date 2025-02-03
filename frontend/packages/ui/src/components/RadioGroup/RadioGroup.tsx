import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import clsx from 'clsx'
import {
  type ComponentProps,
  type ElementRef,
  type ReactNode,
  forwardRef,
} from 'react'
import { Check } from '../../icons'
import styles from './RadioGroup.module.css'

// Root
export const RadioGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  ComponentProps<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={clsx(styles.root, className)}
      {...props}
    />
  )
})

RadioGroup.displayName = 'RadioGroup'

// Item
type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item> & {
  label?: ReactNode
}

export const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, id, ...props }, ref) => {
  const itemId = id ?? props.value

  return (
    <div className={styles.radioWrapper}>
      <RadioGroupPrimitive.Item
        ref={ref}
        id={itemId}
        className={clsx(styles.item, className)}
        {...props}
      >
        {label && (
          <label htmlFor={itemId} className={styles.label}>
            {label}
          </label>
        )}
        <RadioGroupPrimitive.Indicator>
          <Check width={10} height={10} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    </div>
  )
})

RadioGroupItem.displayName = 'RadioGroupItem'
