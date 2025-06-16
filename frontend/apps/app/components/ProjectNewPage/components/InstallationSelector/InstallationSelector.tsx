'use client'

import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components'
import type { Installation, Repository } from '@liam-hq/github'
import {
  type FC,
  useActionState,
  useCallback,
  useState,
  useTransition,
} from 'react'
import { P, match } from 'ts-pattern'
import { RepositoryItem } from '../RepositoryItem'
import styles from './InstallationSelector.module.css'
import { addProject } from './actions/addProject'
import { getRepositories } from './actions/getRepositories'

type Props = {
  installations: Installation[]
  organizationId: string
}

export const InstallationSelector: FC<Props> = ({
  installations,
  organizationId,
}) => {
  const [selectedInstallation, setSelectedInstallation] =
    useState<Installation | null>(null)
  const [isAddingProject, startAddingProjectTransition] = useTransition()
  const [, startTransition] = useTransition()

  const [repositoriesState, repositoriesAction, isRepositoriesLoading] =
    useActionState(getRepositories, { repositories: [], loading: false })

  const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL

  const handleSelectInstallation = (installation: Installation) => {
    setSelectedInstallation(installation)
    startTransition(() => {
      const formData = new FormData()
      formData.append('installationId', installation.id.toString())
      repositoriesAction(formData)
    })
  }

  const handleClick = useCallback(
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

      {isRepositoriesLoading && <div>Loading repositories...</div>}

      {!isRepositoriesLoading && repositoriesState.repositories.length > 0 && (
        <div className={styles.repositoriesList}>
          <h3>Repositories</h3>
          {repositoriesState.repositories.map((repo) => (
            <RepositoryItem
              key={repo.id}
              name={repo.name}
              onClick={() => handleClick(repo)}
              isLoading={isAddingProject}
            />
          ))}
        </div>
      )}

      {!isRepositoriesLoading &&
        selectedInstallation &&
        repositoriesState.repositories.length === 0 &&
        repositoriesState.error && <div>Error: {repositoriesState.error}</div>}

      {!isRepositoriesLoading &&
        selectedInstallation &&
        repositoriesState.repositories.length === 0 &&
        !repositoriesState.error && <div>No repositories found</div>}
    </>
  )
}
