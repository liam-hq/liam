import {
  Content,
  Item,
  ItemIndicator,
  Label,
  Portal,
  RadioGroup,
  RadioItem,
  Root,
  Separator,
  Trigger,
} from '@radix-ui/react-dropdown-menu'
import clsx from 'clsx'
import type { ComponentProps, ReactNode, Ref } from 'react'
import { match } from 'ts-pattern'
import { Check } from '../../icons'
import styles from './DropdownMenu.module.css'

export const DropdownMenuRoot = Root
export const DropdownMenuTrigger = Trigger
export const DropdownMenuPortal = Portal
export const DropdownMenuRadioGroup = RadioGroup
export const DropdownMenuLabel = Label
export const DropdownMenuContent = ({
  className,
  ref,
  ...props
}: ComponentProps<typeof Content> & {
  ref?: Ref<HTMLDivElement>
}) => {
  return (
    <Content {...props} ref={ref} className={clsx(className, styles.content)} />
  )
}

DropdownMenuContent.displayName = 'DropdownMenuContent'

type DropdownMenuItemProps = ComponentProps<typeof Item> & {
  variant?: 'default' | 'danger'
  size?: 'sm' | 'md'
  leftIcon?: ReactNode
  ref?: Ref<HTMLDivElement>
}
export const DropdownMenuItem = ({
  variant = 'default',
  size = 'md',
  leftIcon,
  children,
  className,
  ref,
  ...props
}: DropdownMenuItemProps) => {
  const sizeClassName = match(size)
    .with('sm', () => styles.sm)
    .with('md', () => styles.md)
    .exhaustive()

  const variantClassName = match(variant)
    .with('default', () => styles.default)
    .with('danger', () => styles.danger)
    .exhaustive()

  return (
    <Item
      {...props}
      ref={ref}
      className={clsx(styles.item, sizeClassName, variantClassName, className)}
    >
      {leftIcon && (
        <span className={clsx(styles.icon, styles.leftIcon)}>{leftIcon}</span>
      )}
      {children}
    </Item>
  )
}

DropdownMenuItem.displayName = 'DropdownMenuItem'

type DropdownMenuRadioItemProps = ComponentProps<typeof RadioItem> & {
  label: string
  ref?: Ref<HTMLDivElement>
}

export const DropdownMenuRadioItem = ({
  className,
  label,
  ref,
  ...props
}: DropdownMenuRadioItemProps) => {
  return (
    <RadioItem
      {...props}
      ref={ref}
      className={clsx(styles.item, styles.radioItem, styles.default, className)}
    >
      {label}
      <ItemIndicator>
        <Check width={10} height={10} />
      </ItemIndicator>
    </RadioItem>
  )
}

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

export const DropdownMenuSeparator = () => {
  return <Separator className={styles.separator} />
}

// Re-export for custom implementations
export {
  ItemIndicator as DropdownMenuItemIndicator,
  RadioItem as DropdownMenuPrimitiveRadioItem,
} from '@radix-ui/react-dropdown-menu'
