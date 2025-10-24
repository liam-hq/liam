'use client'

import type { Installation, Repository } from '@liam-hq/github'
import {
  type FC,
  useActionState,
  useCallback,
  useState,
  useTransition,
} from 'react'
import { match, P } from 'ts-pattern'
import { addProject } from './actions/addProject'
import { getRepositories } from './actions/getRepositories'
import { EmptyStateCard } from './components/EmptyStateCard'
import { HeaderActions } from './components/HeaderActions'
import { RepositoryList } from './components/RepositoryList'
import styles from './InstallationSelector.module.css'

type Props = {
  installations: Installation[]
  organizationId: string
  needsRefresh?: boolean
}

type EmptyStateVariant = 'connect' | 'reauth'

export const InstallationSelector: FC<Props> = ({
  installations,
  organizationId,
  needsRefresh = false,
}) => {
  const [selectedInstallation, setSelectedInstallation] =
    useState<Installation | null>(null)
  const [isAddingProject, startAddingProjectTransition] = useTransition()
  const [, startTransition] = useTransition()

  const [repositoriesState, repositoriesAction, isRepositoriesLoading] =
    useActionState(getRepositories, { repositories: [], loading: false })

  const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL

  const hasInstallations = installations.length > 0

  const handleInstallApp = useCallback(() => {
    if (!githubAppUrl) return
    window.open(githubAppUrl, '_blank', 'noopener,noreferrer')
  }, [githubAppUrl])

  const handleConnectGitHub = useCallback(() => {
    handleInstallApp()
  }, [handleInstallApp])

  const handleSelectInstallation = useCallback(
    (installation: Installation) => {
      if (needsRefresh) return

      setSelectedInstallation(installation)
      startTransition(() => {
        startAddingProjectTransition(() => {
          const formData = new FormData()
          formData.append('installationId', installation.id.toString())
          repositoriesAction(formData)
        })
      })
    },
    [needsRefresh, repositoriesAction],
  )

  const handleSelectRepository = useCallback(
    async (repository: Repository) => {
      startAddingProjectTransition(async () => {
        try {
          const formData = new FormData()
          formData.set('projectName', repository.name)
          formData.set('repositoryName', repository.name)
          formData.set('repositoryOwner', repository.owner.login)
          formData.set('repositoryIdentifier', repository.id.toString())
          formData.set(
            'installationId',
            selectedInstallation?.id.toString() || '',
          )
          formData.set('organizationId', organizationId.toString())

          await addProject(formData)
        } catch (error) {
          console.error('Error adding project:', error)
        }
      })
    },
    [selectedInstallation, organizationId],
  )

  const emptyStateVariant: EmptyStateVariant | null = needsRefresh
    ? 'reauth'
    : hasInstallations
      ? null
      : 'connect'

  const dropdownLabel = selectedInstallation
    ? match(selectedInstallation.account)
        .with({ login: P.string }, (item) => item.login)
        .otherwise(() => 'Select installation')
    : 'Select installation'

  return (
    <section className={styles.container}>
      <HeaderActions
        hasInstallations={hasInstallations}
        needsRefresh={needsRefresh}
        installations={installations}
        selectedInstallationLabel={dropdownLabel}
        onSelectInstallation={handleSelectInstallation}
        onInstallApp={handleInstallApp}
        onConnectGitHub={handleConnectGitHub}
        hasGithubAppUrl={!!githubAppUrl}
      />

      <div className={styles.panel}>
        <div className={styles.panelContent}>
          {isRepositoriesLoading ? (
            <div className={styles.loading}>Loading repositories...</div>
          ) : emptyStateVariant ? (
            <EmptyStateCard
              variant={emptyStateVariant}
              onActionClick={handleConnectGitHub}
              actionDisabled={!githubAppUrl}
            />
          ) : (
            <RepositoryList
              repositories={repositoriesState.repositories}
              error={repositoriesState.error}
              isAddingProject={isAddingProject}
              hasSelectedInstallation={Boolean(selectedInstallation)}
              onSelectRepository={handleSelectRepository}
            />
          )}
        </div>
      </div>
    </section>
  )
}
