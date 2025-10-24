import type { Installation } from '@liam-hq/github'
import {
  Button,
  ChevronDown,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  GithubLogo,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { match, P } from 'ts-pattern'
import styles from './InstallationDropdown.module.css'

type InstallationDropdownProps = {
  installations: Installation[]
  selectedLabel: string
  onSelect: (installation: Installation) => void
  disabled: boolean
}

export const InstallationDropdown: FC<InstallationDropdownProps> = ({
  installations,
  selectedLabel,
  onSelect,
  disabled,
}) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          size="md"
          variant="outline-secondary"
          disabled={disabled}
          className={styles.dropdownTrigger}
        >
          <GithubLogo
            className={styles.githubIcon}
            aria-hidden
            focusable="false"
          />
          <span className={styles.dropdownLabel}>{selectedLabel}</span>
          <span className={styles.dropdownSpacer} />
          <ChevronDown
            className={styles.dropdownIcon}
            aria-hidden
            focusable="false"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={styles.dropdownContent}>
        {installations.map((installation) => {
          const login = match(installation.account)
            .with({ login: P.string }, (account) => account.login)
            .otherwise(() => null)

          if (login === null) return null

          return (
            <DropdownMenuItem
              key={installation.id}
              onSelect={() => onSelect(installation)}
              leftIcon={
                <GithubLogo
                  className={styles.menuItemIcon}
                  aria-hidden
                  focusable="false"
                />
              }
            >
              {login}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}
