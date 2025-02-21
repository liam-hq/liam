import {
  LiamLogoMark,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './AppBar.module.css'
import { CopyLinkButton } from './CopyLinkButton'
import { GithubButton } from './GithubButton'
import { HelpButton } from './HelpButton'
import { MenuButton } from './MenuButton'
import { ReleaseNoteButton } from './ReleaseNoteButton'

export const AppBar: FC = () => {
  return (
    <header className={styles.wrapper}>
      <div className={styles.menuButtonWrapper}>
        <MenuButton />
      </div>
      <div className={styles.logoWrapper}>
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <a
                href="https://liambx.com"
                target="_blank"
                rel="noreferrer"
                className={styles.iconWrapper}
              >
                <LiamLogoMark className={styles.logo} />
              </a>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent sideOffset={4}>Go to Home page</TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </div>

      <h1 className={styles.title}>Liam ERD</h1>

      <div className={styles.rightSide}>
        <div className={styles.iconButtonGroup}>
          <GithubButton />
          <ReleaseNoteButton />
          <HelpButton />
        </div>
        {/* TODO: enable once implemented */}
        {/* <ExportButton /> */}
        <CopyLinkButton />
      </div>
    </header>
  )
}
