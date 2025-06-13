'use client'

import { Slot } from '@radix-ui/react-slot'
import clsx from 'clsx'
import {
  type CSSProperties,
  type ComponentProps,
  type ElementRef,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PanelLeft } from '../../icons'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '../Tooltip'
import styles from './Sidebar.module.css'

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

export type SidebarState = 'expanded' | 'collapsed'
type SidebarContext = {
  state: SidebarState
  open: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }

  return context
}

const SidebarProvider = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'> & {
    open: boolean
    onOpenChange?: (nextPanelState: boolean) => void
  }
>(({ open, onOpenChange, className, style, children, ...props }, ref) => {
  const [openMobile, setOpenMobile] = useState(false)

  // Helper to toggle the sidebar.
  const toggleSidebar = useCallback(() => {
    onOpenChange?.(!open)
  }, [onOpenChange, open])

  // Adds a keyboard shortcut to toggle the sidebar.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? 'expanded' : 'collapsed'

  const contextValue = useMemo<SidebarContext>(
    () => ({
      state,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      open,
    }),
    [state, openMobile, toggleSidebar, open],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          className={clsx(styles.sidebarProvider, className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = 'SidebarProvider'

const Sidebar = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'> & {
    collapsible?: 'offcanvas' | 'icon' | 'none'
  }
>(({ collapsible = 'offcanvas', className, children, ...props }, ref) => {
  const { state } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div className={clsx(className)} ref={ref} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div className={styles.sidebarGap} />
      <div className={clsx(styles.sidebarWrapper, className)} {...props}>
        <div data-sidebar="sidebar" className={styles.sidebar}>
          {children}
        </div>
      </div>
    </div>
  )
})
Sidebar.displayName = 'Sidebar'

type SidebarTriggerProps = Omit<ComponentProps<'button'>, 'onClick'> & {
  onClick?: (state: SidebarState) => void
}

const SidebarTrigger = forwardRef<ElementRef<'button'>, SidebarTriggerProps>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar, state } = useSidebar()

    return (
      <TooltipRoot>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            data-sidebar="trigger"
            aria-label="Toggle Sidebar Icon Button"
            data-testid="toggle-sidebar-icon-button"
            className={clsx(styles.sidebarTrigger, className)}
            onClick={toggleSidebar}
            {...props}
          >
            <PanelLeft width={16} height={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={8}>
          {state === 'collapsed' ? 'Expand' : 'Collapse'}
        </TooltipContent>
      </TooltipRoot>
    )
  },
)
SidebarTrigger.displayName = 'SidebarTrigger'

const SidebarHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} data-sidebar="header" {...props} />
  },
)
SidebarHeader.displayName = 'SidebarHeader'

const SidebarFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="footer"
        className={clsx(styles.sidebarFooter, className)}
        {...props}
      />
    )
  },
)
SidebarFooter.displayName = 'SidebarFooter'

const SidebarContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={clsx(styles.sidebarContent, className)}
        {...props}
      />
    )
  },
)
SidebarContent.displayName = 'SidebarContent'

const SidebarGroup = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={clsx(className)}
        {...props}
      />
    )
  },
)
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'> & { asChild?: boolean }
>(({ className, children, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={clsx(styles.sidebarGroupLabel, className)}
      {...props}
    >
      <span>{children}</span>
    </Comp>
  )
})
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarGroupAction = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return <Comp ref={ref} data-sidebar="group-action" {...props} />
})
SidebarGroupAction.displayName = 'SidebarGroupAction'

const SidebarGroupContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={clsx(className)}
      {...props}
    />
  ),
)
SidebarGroupContent.displayName = 'SidebarGroupContent'

const SidebarMenu = forwardRef<HTMLUListElement, ComponentProps<'ul'>>(
  ({ ...props }, ref) => <ul ref={ref} data-sidebar="menu" {...props} />,
)
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = forwardRef<HTMLLIElement, ComponentProps<'li'>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={clsx(styles.sidebarMenuItem, className)}
      {...props}
    />
  ),
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

const SidebarMenuButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | ComponentProps<typeof TooltipContent>
    showtooltip?: boolean
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      tooltip,
      className,
      showtooltip,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={clsx(styles.sidebarMenuButton, className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === 'string') {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <TooltipRoot>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          hidden={!showtooltip}
          {...tooltip}
        />
      </TooltipRoot>
    )
  },
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

const SidebarMenuAction = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={clsx(
        styles.sidebarMenuAction,
        showOnHover && styles.showOnHover,
        className,
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = 'SidebarMenuAction'

const SidebarMenuBadge = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="menu-badge" {...props} />
  ),
)
SidebarMenuBadge.displayName = 'SidebarMenuBadge'

const SidebarMenuSub = forwardRef<HTMLUListElement, ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} data-sidebar="menu-sub" {...props} />
  ),
)
SidebarMenuSub.displayName = 'SidebarMenuSub'

const SidebarMenuSubItem = forwardRef<HTMLLIElement, ComponentProps<'li'>>(
  ({ ...props }, ref) => <li ref={ref} {...props} />,
)
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem'

const SidebarMenuSubButton = forwardRef<
  HTMLAnchorElement,
  ComponentProps<'a'> & {
    asChild?: boolean
    size?: 'sm' | 'md'
    isActive?: boolean
  }
>(({ asChild = false, size = 'md', isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton'

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
