'use client'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components'
import { ProjectIcon } from '@/components/ProjectsPage/components/ProjectsListView/components/ProjectItem/ProjectIcon'
import { ChevronsUpDown } from '@/icons'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import * as v from 'valibot'
import styles from './ProjectsDropdown.module.css'

type Project = {
  id: string
  name: string
}

const ProjectsResponseSchema = v.object({
  data: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
    }),
  ),
})

type Props = {
  name?: string
  defaultValue?: string
}

export const ProjectsDropdown: FC<Props> = ({
  name = 'projectId',
  defaultValue = '',
}) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(defaultValue || null)

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        const data = await response.json()
        const result = v.safeParse(ProjectsResponseSchema, data)
        if (result.success) {
          setProjects(result.output.data)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger className={styles.trigger}>
        <div className={styles.iconAndName}>
          <ProjectIcon className={styles.projectIcon} />
          <span className={styles.projectName}>
            {selectedProject?.name || 'Select Project (Optional)'}
          </span>
        </div>
        <ChevronsUpDown className={styles.chevronIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          align="start"
          sideOffset={5}
          className={styles.content}
        >
          <DropdownMenuRadioGroup
            value={selectedProjectId || ''}
            onValueChange={(value) => setSelectedProjectId(value || null)}
          >
            <DropdownMenuRadioItem value="" label="No Project" />
            <DropdownMenuSeparator />
            {isLoading ? (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : (
              projects.map(({ id, name }) => (
                <DropdownMenuRadioItem key={id} value={id} label={name} />
              ))
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
      <input
        type="hidden"
        name={name}
        value={selectedProjectId || ''}
      />
    </DropdownMenuRoot>
  )
}