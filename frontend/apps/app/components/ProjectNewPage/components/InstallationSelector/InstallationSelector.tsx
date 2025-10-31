'use client'
import type { Installation, Repository } from '@liam-hq/github'
import {
  type FC,
  useActionState,
  useCallback,
  useEffect,
  useTransition,
} from 'react'
import { match, P } from 'ts-pattern'
import { getRepositories } from './actions/getRepositories'
import { EmptyStateCard } from './components/EmptyStateCard'
import { HeaderActions } from './components/HeaderActions'
import { InstallationDropdown } from './components/InstallationDropdown'
import { RepositoryList } from './components/RepositoryList'
import { RepositoryListSkeleton } from './components/RepositoryListSkeleton'
import styles from './InstallationSelector.module.css'

type Props = {
  installations: Installation[]
  selectedInstallation: Installation | null
  needsRefresh?: boolean
  onSelectInstallation: (item: Installation | null) => void
  onSelectRepository: (item: Repository) => void
}

type EmptyStateVariant = 'noInstaller' | 'reauth'

export const InstallationSelector: FC<Props> = ({
  installations,
  selectedInstallation,
  needsRefresh = false,
  onSelectInstallation,
  onSelectRepository,
}) => {
  const [isAddingProject, startAddingProjectTransition] = useTransition()
  const [, startTransition] = useTransition()

  const [repositoriesState, repositoriesAction, isRepositoriesLoading] =
    useActionState(getRepositories, { repositories: [], loading: true })
  const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL

  const handleInstallApp = useCallback(() => {
    if (!githubAppUrl) return
    window.open(githubAppUrl, '_blank', 'noopener,noreferrer')
  }, [githubAppUrl])

  const handleConnectGitHub = useCallback(() => {
    // TODO: Currently this only opens the installation page, but we should pass an OAuth re-authentication handler in the future.
    handleInstallApp()
  }, [handleInstallApp])

  const hasInstallations = installations.length > 0

  const emptyStateVariant: EmptyStateVariant | null = needsRefresh
    ? 'reauth'
    : hasInstallations
      ? null
      : 'noInstaller'

  const emptyStateContent = match(emptyStateVariant)
    .with('reauth', () => ({
      description:
        'Reconnect your GitHub account to refresh access to your repositories.',
      actionText: 'Re-authenticate',
      onActionClick: handleConnectGitHub,
    }))
    .with('noInstaller', () => ({
      description: 'Add a GitHub installation to see your repositories.',
      actionText: 'Configure Repositories on GitHub',
      onActionClick: handleInstallApp,
    }))
    .otherwise(() => null)

  const showRepositoriesSkeleton =
    isRepositoriesLoading || repositoriesState.loading
  const shouldShowSkeleton = !emptyStateContent && showRepositoriesSkeleton

  const isInstallationDropdownDisabled =
    emptyStateVariant === 'reauth' || emptyStateVariant === 'noInstaller'

  const isInstallButtonDisabled =
    !githubAppUrl || emptyStateVariant === 'reauth'

  const handleSelectInstallation = useCallback(
    (installation: Installation) => {
      if (needsRefresh) return
      onSelectInstallation(installation)
    },
    [needsRefresh, onSelectInstallation],
  )

  useEffect(() => {
    if (emptyStateVariant === 'reauth' || emptyStateVariant === 'noInstaller') {
      if (selectedInstallation !== null) {
        onSelectInstallation(null)
      }
      return
    }

    if (
      selectedInstallation &&
      installations.some(
        (installation) => installation.id === selectedInstallation.id,
      )
    ) {
      return
    }

    const nextInstallation = installations[0] ?? null
    onSelectInstallation(nextInstallation)
  }, [
    emptyStateVariant,
    installations,
    selectedInstallation,
    onSelectInstallation,
  ])

  useEffect(() => {
    if (!selectedInstallation || needsRefresh) {
      return
    }

    startTransition(() => {
      startAddingProjectTransition(() => {
        const formData = new FormData()
        formData.append('installationId', selectedInstallation.id.toString())
        repositoriesAction(formData)
      })
    })
  }, [needsRefresh, repositoriesAction, selectedInstallation])

  const dropdownLabel = selectedInstallation
    ? match(selectedInstallation.account)
        .with({ login: P.string }, (item) => item.login)
        .otherwise(() => 'Select installation')
    : 'Select installation'

  return (
    <section className={styles.container}>
      <HeaderActions
        installationDropdown={
          <InstallationDropdown
            installations={installations}
            disabled={isInstallationDropdownDisabled}
            selectedLabel={dropdownLabel}
            onSelect={handleSelectInstallation}
          />
        }
        onInstallApp={handleInstallApp}
        installButtonDisabled={isInstallButtonDisabled}
      />

      <div className={styles.panel}>
        <div className={styles.panelContent}>
          {shouldShowSkeleton ? (
            <RepositoryListSkeleton />
          ) : emptyStateContent ? (
            <EmptyStateCard
              description={emptyStateContent.description}
              actionText={emptyStateContent.actionText}
              onActionClick={emptyStateContent.onActionClick}
              actionDisabled={!githubAppUrl}
            />
          ) : (
            <RepositoryList
              repositories={repositoriesState.repositories}
              error={repositoriesState.error}
              isAddingProject={isAddingProject}
              hasSelectedInstallation={Boolean(selectedInstallation)}
              onSelectRepository={onSelectRepository}
            />
          )}
        </div>
      </div>
    </section>
  )
}
