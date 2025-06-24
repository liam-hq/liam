'use client'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  Plus,
} from '@liam-hq/ui'
import type { FC } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { ProjectRadioItem } from './ProjectRadioItem'
import styles from './ProjectsDropdown.module.css'

type Props = {
  projects: Projects
  selectedProjectId?: string
  onProjectChange: (projectId: string) => void
}

export const Content: FC<Props> = ({
  projects,
  selectedProjectId,
  onProjectChange,
}) => {
  const handleValueChange = (value: string) => {
    if (value === '') {
      // Allow empty value for optional field
      onProjectChange('')
    } else {
      onProjectChange(value)
    }
  }

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        sideOffset={5}
        className={styles.content}
      >
        <DropdownMenuRadioGroup
          value={selectedProjectId || ''}
          onValueChange={handleValueChange}
        >
          <ProjectRadioItem
            value=""
            label="No project selected"
            showIcon={false}
          />
          {projects.map(({ id, name }) => (
            <ProjectRadioItem
              key={id}
              value={id}
              label={name}
              showIcon={true}
              isRepository={false} // TODO: Check if project has repository
            />
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            window.open('/projects/new', '_blank')
          }}
          className={styles.addNewProject}
        >
          <Plus className={styles.addIcon} />
          <span>Add New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
