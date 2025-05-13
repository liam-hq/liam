import { DropdownMenuRoot, DropdownMenuTrigger } from '@/components'
import { ProjectIcon } from '@/components/ProjectsPage/components/ProjectsListView/components/ProjectItem/ProjectIcon'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { ChevronsUpDown } from '@/icons'
import type { FC } from 'react'
import { Content } from './Content'
import styles from './ProjectsDropdownMenu.module.css'
import { getProject } from './services/getProject'
import { getProjects } from './services/getProjects'

type Props = {
  currentProjectId: string
}

export const ProjectsDropdownMenu: FC<Props> = async ({ currentProjectId }) => {
  const organizationId = await getOrganizationId()
  const { data: projects } = await getProjects(organizationId)
  if (projects == null) {
    return null
  }

  const { data: currentProject } = await getProject(currentProjectId)
  if (currentProject == null) {
    return null
  }

  return (
    <DropdownMenuRoot>
      <Trigger label={currentProject.name} />
      <Content currentProject={currentProject} projects={projects} />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  label: string
}

const Trigger: FC<TriggerProps> = ({ label }) => {
  return (
    <DropdownMenuTrigger className={styles.trigger}>
      <div className={styles.iconAndName}>
        <ProjectIcon className={styles.projectIcon} />
        <span className={styles.projectName}>{label}</span>
      </div>
      <ChevronsUpDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
