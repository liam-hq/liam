'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import clsx from 'clsx'
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from 'react'
import { Check, ChevronDown, ChevronUp } from '../..'
import styles from './Select.module.css'

export const Select = SelectPrimitive.Root

export const SelectGroup = SelectPrimitive.Group

export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
    ref={ref}
    className={clsx(styles.trigger, className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className={styles.icon} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export const SelectScrollUpButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
    ref={ref}
    className={clsx(styles.scrollButton, className)}
    {...props}
  >
    <ChevronUp className={styles.scrollIcon} />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

export const SelectScrollDownButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
    ref={ref}
    className={clsx(styles.scrollButton, className)}
    {...props}
  >
    <ChevronDown className={styles.scrollIcon} />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
      ref={ref}
      className={clsx(
        styles.content,
        position === 'popper' && styles.contentPopper,
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={clsx(
          styles.viewport,
          position === 'popper' && styles.viewportPopper,
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

export const SelectLabel = forwardRef<
  ElementRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
    ref={ref}
    className={clsx(styles.label, className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
    ref={ref}
    className={clsx(styles.item, className)}
    {...props}
  >
    <span className={styles.itemIndicator}>
      <SelectPrimitive.ItemIndicator>
        <Check className={styles.checkIcon} />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export const SelectSeparator = forwardRef<
  ElementRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    // biome-ignore lint/style/noParameterAssign: This is a false positive - ref is being passed to a prop, not reassigned
    ref={ref}
    className={clsx(styles.separator, className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName
