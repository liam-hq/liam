'use client'

import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components'
import { createClient } from '@/libs/db/client'
import { getRepositoriesByInstallationId } from '@liam-hq/github'
import type { Installation, Repository } from '@liam-hq/github'
import { type FC, useCallback, useEffect, useState } from 'react'
import { P, match } from 'ts-pattern'
import { RepositoryItem } from '../RepositoryItem'
import styles from './InstallationSelector.module.css'
import { addProject } from './actions/addProject'

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
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddingProject, setIsAddingProject] = useState(false)

  const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL

  useEffect(() => {
    if (selectedInstallation) {
      fetchRepositories(selectedInstallation.id)
    }
  }, [selectedInstallation])

  const fetchRepositories = async (installationId: number) => {
    setLoading(true)
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (session === null) {
        throw new Error('')
      }

      const res = await getRepositoriesByInstallationId(
        data.session,
        installationId,
      )
      setRepositories(res.repositories)
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectInstallation = (installation: Installation) => {
    setSelectedInstallation(installation)
  }

  const handleClick = useCallback(
    async (repository: Repository) => {
      try {
        setIsAddingProject(true)

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
        // This point is not reached because a redirect occurs on success
      } catch (error) {
        console.error('Error adding project:', error)
        setIsAddingProject(false)
      }
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

      {loading && <div>Loading repositories...</div>}

      {!loading && repositories.length > 0 && (
        <div className={styles.repositoriesList}>
          <h3>Repositories</h3>
          {repositories.map((repo) => (
            <RepositoryItem
              key={repo.id}
              name={repo.name}
              onClick={() => handleClick(repo)}
              isLoading={isAddingProject}
            />
          ))}
        </div>
      )}

      {!loading && selectedInstallation && repositories.length === 0 && (
        <div>No repositories found</div>
      )}
    </>
  )
}
