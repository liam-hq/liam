'use client'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components'
import { Plus } from '@/icons'
import { urlgen } from '@/libs/routes'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import styles from './ProjectsDropdownMenu.module.css'
import type { Project } from './services/getProject'
import type { Projects } from './services/getProjects'

type Props = {
  currentProject: Project
  projects: Projects
}

export const Content: FC<Props> = ({ currentProject, projects }) => {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push(urlgen('projects/new'))
  }, [router])

  const handleChangeProject = useCallback(
    (projectId: string) => {
      // TODO: Replace the current path's :projectId with the selected project and navigate to that path
      router.push(
        urlgen('projects/[projectId]', {
          projectId,
        }),
      )
    },
    [router],
  )

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        sideOffset={5}
        className={styles.content}
      >
        <DropdownMenuRadioGroup
          value={currentProject.id}
          onValueChange={handleChangeProject}
        >
          {projects
            .sort((a, b) => {
              // If a is selected, it comes first
              if (a.id === currentProject.id) return -1
              // If b is selected, it comes first
              if (b.id === currentProject.id) return 1
              // Otherwise, maintain original order
              return 0
            })
            .map(({ id, name }) => (
              <DropdownMenuRadioItem key={id} value={id} label={name} />
            ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem leftIcon={<Plus />} onClick={handleClick}>
          Add New Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
