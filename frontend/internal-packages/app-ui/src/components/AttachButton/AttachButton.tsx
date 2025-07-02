'use client'

import {
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
  Paperclip,
} from '@liam-hq/ui'
import clsx from 'clsx'
import type { ComponentProps, Ref } from 'react'
import { useRef } from 'react'
import styles from './AttachButton.module.css'

type AttachButtonProps = ComponentProps<'button'> & {
  tooltipSide?: ComponentProps<typeof ArrowTooltipContent>['side']
  ref?: Ref<HTMLButtonElement>
  onFileSelect?: (files: FileList) => void
  accept?: string
}

export const AttachButton = ({
  tooltipSide = 'top',
  className,
  ref,
  onFileSelect,
  accept = 'image/*',
  ...props
}: AttachButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    fileInputRef.current?.click()
    props.onClick?.(e)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        hidden
        multiple
      />
      <ArrowTooltipProvider>
        <ArrowTooltipRoot>
          <ArrowTooltipTrigger asChild>
            <button
              ref={ref}
              type="button"
              className={clsx(
                styles.button,
                props.disabled && styles.disabled,
                className,
              )}
              {...props}
              onClick={handleClick}
            >
              <Paperclip className={styles.icon} />
            </button>
          </ArrowTooltipTrigger>
          <ArrowTooltipPortal>
            <ArrowTooltipContent side={tooltipSide} sideOffset={8}>
              Attach Images, Files, etc.
            </ArrowTooltipContent>
          </ArrowTooltipPortal>
        </ArrowTooltipRoot>
      </ArrowTooltipProvider>
    </>
  )
}

AttachButton.displayName = 'AttachButton'
