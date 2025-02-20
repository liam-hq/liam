import {
  Megaphone,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ReleaseNoteButton.module.css'

export const ReleaseNoteButton: FC = () => {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <a
            href="https://github.com/liam-hq/liam/releases"
            target="_blank"
            rel="noreferrer"
            className={styles.iconWrapper}
          >
            <Megaphone className={styles.icon} />
          </a>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent sideOffset={4}>Release Notes</TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}
