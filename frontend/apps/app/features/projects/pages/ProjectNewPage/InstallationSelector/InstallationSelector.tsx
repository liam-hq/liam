'use client'

import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components'
import type { Installation } from '@liam-hq/github'
import { type FC, useState } from 'react'
import { P, match } from 'ts-pattern'
import styles from './InstallationSelector.module.css'
import { RepositoriesPanel } from './RepositoriesPanel'

type Props = {
  installations: Installation[]
  organizationId: string
}

const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL

export const InstallationSelector: FC<Props> = ({
  installations,
  organizationId,
}) => {
  const [selectedInstallation, setSelectedInstallation] =
    useState<Installation | null>(null)

  const handleSelectInstallation = (installation: Installation) => {
    setSelectedInstallation(installation)
  }

  return (
    <>
      <div className={styles.installationSelector}>
        <Button size="lg" variant="ghost-secondary">
          <a href={githubAppUrl} target="_blank" rel="noopener noreferrer">
            Install GitHub App
          </a>
        </Button>
      </div>
      <div className={styles.installationSelector}>
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <Button size="lg" variant="ghost-secondary">
              {selectedInstallation
                ? match(selectedInstallation.account)
                    .with({ login: P.string }, (item) => item.login)
                    .otherwise(() => 'Select installation')
                : 'Select installation'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {installations.map((item) => {
              const login = match(item.account)
                .with({ login: P.string }, (item) => item.login)
                .otherwise(() => null)

              if (login === null) return null

              return (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => handleSelectInstallation(item)}
                >
                  {login}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </div>

      {selectedInstallation && (
        <RepositoriesPanel
          installationId={selectedInstallation.id}
          organizationId={organizationId}
        />
      )}
    </>
  )
}
