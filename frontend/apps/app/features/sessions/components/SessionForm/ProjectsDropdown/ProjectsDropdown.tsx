'use client'

import {
  ChevronDown,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  Link2,
} from '@liam-hq/ui'
import type { FC } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { ProjectIcon } from '../../../../../components/ProjectIcon'
import { Content } from './Content'
import styles from './ProjectsDropdown.module.css'

type Props = {
  projects: Projects
  selectedProjectId?: string
  onProjectChange: (projectId: string) => void
  disabled?: boolean
}

export const ProjectsDropdown: FC<Props> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  disabled = false,
}) => {
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const label = selectedProject?.name || 'Connect Project'

  return (
    <DropdownMenuRoot>
      <Trigger label={label} disabled={disabled} />
      <Content
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={onProjectChange}
      />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  label: string
  disabled?: boolean
}

const Trigger: FC<TriggerProps> = ({ label, disabled }) => {
  const hasSelection = label !== 'Connect Project'

  return (
    <DropdownMenuTrigger className={styles.trigger} disabled={disabled}>
      <div className={styles.iconAndName}>
        {hasSelection ? (
          <ProjectIcon className={styles.projectIcon} />
        ) : (
          <Link2 className={styles.projectIcon} />
        )}
        <span className={styles.projectName}>{label}</span>
      </div>
      <ChevronDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
