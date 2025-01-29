import { clsx } from 'clsx'
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from 'react'
import { Drawer } from 'vaul'
import styles from './Drawer.module.css'

export const DrawerRoot = Drawer.Root

export const DrawerTrigger = Drawer.Trigger

export const DrawerPortal = Drawer.Portal

export const DrawerContent = forwardRef<
  ElementRef<typeof Drawer.Content>,
  ComponentPropsWithoutRef<typeof Drawer.Content>
>(({ className, children, ...props }, ref) => (
  <Drawer.Content
    ref={ref}
    {...props}
    className={clsx(className, styles.content)}
  >
    {children}
  </Drawer.Content>
))
DrawerContent.displayName = Drawer.Content.displayName

export const DrawerTitle = Drawer.Title

export const DrawerDescription = Drawer.Description

export const DrawerClose = Drawer.Close
