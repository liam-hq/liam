import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from '@liam-hq/ui'
import { Check, Plus } from '@liam-hq/ui/src/icons'
import type { ComponentProps } from 'react'
import { ProjectIcon } from '../ProjectIcon'
import styles from './ProjectsDropdown.module.css'
interface ProjectItem {
  id: string
  name: string
}

interface ProjectsDropdownProps extends ComponentProps<'div'> {
  projects: ProjectItem[]
  selectedProjectId?: string | undefined
  onProjectSelect: (project: ProjectItem) => void
  onAddNewProject?: () => void
}

export const ProjectsDropdown = ({
  projects,
  selectedProjectId,
  onProjectSelect,
  onAddNewProject,
  ...props
}: ProjectsDropdownProps) => {
  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        className={styles.dropdownContainer}
        sideOffset={5}
        align="start"
        {...props}
      >
        <div className={styles.projectsList}>
          {/* Sort projects to put the selected project at the top */}
          {projects
            .slice()
            .sort((a, b) => {
              // If a is selected, it comes first
              if (a.id === selectedProjectId) return -1
              // If b is selected, it comes first
              if (b.id === selectedProjectId) return 1
              // Otherwise, maintain original order
              return 0
            })
            .map((project) => (
              <DropdownMenuItem
                key={project.id}
                className={`${styles.projectItem} ${
                  project.id === selectedProjectId ? styles.selected : ''
                }`}
                onClick={() => onProjectSelect(project)}
                leftIcon={
                  <ProjectIcon
                    width={16}
                    height={16}
                    color="rgba(255, 255, 255, 0.2)"
                  />
                }
              >
                <span className={styles.projectName}>{project.name}</span>
                {project.id === selectedProjectId && (
                  <span className={styles.chevronContainer}>
                    <Check width={10} height={10} color="#1DED83" />
                  </span>
                )}
              </DropdownMenuItem>
            ))}
        </div>

        <DropdownMenuItem
          className={styles.addNewProject}
          onClick={onAddNewProject}
          leftIcon={<Plus width={16} height={16} strokeWidth={1.5} />}
          size="md"
        >
          <span className={styles.addNewProjectText}>Add New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
