import { Avatar, ChevronRight, ChevronsUpDown } from '@liam-hq/ui'
import { DropdownMenuRoot, DropdownMenuTrigger } from '@liam-hq/ui'
import type { ComponentProps, ReactNode } from 'react'
import { forwardRef, useState } from 'react'
import { BranchDropdown } from '../BranchDropdown/BranchDropdown'
import { ProjectIcon } from '../ProjectIcon'
import { ProjectsDropdown } from '../ProjectsDropdown'
import styles from './AppBar.module.css'

type BreadcrumbItemProps = {
  label: string
  icon?: ReactNode | undefined
  tag?: string | undefined
  onClick?: (() => void) | undefined
  isActive?: boolean
  isProject?: boolean
}

// Define a simple Project interface that matches ProjectItem from UI package
export interface Project {
  id: string
  name: string
}

interface ProjectsList {
  projects: Project[]
  onProjectSelect: (project: Project) => void
  onAddNewProject?: () => void
}

// Define a simple Branch interface that matches BranchItem
interface Branch {
  id: string
  name: string
  tag?: string
}

interface BranchesList {
  branches: Branch[]
  onBranchSelect: (branch: Branch) => void
}

type AppBarProps = {
  project?: Project
  branchName: string
  branchTag: string
  onProjectClick?: () => void
  onBranchClick?: () => void
  onAvatarClick?: () => void
  avatarInitial?: string
  avatarColor?: string
  minimal?: boolean
  projectsList?: ProjectsList
  branchesList?: BranchesList
  onSearchChange?: (value: string) => void
} & ComponentProps<'div'>

export const AppBar = ({
  project,
  branchName: initialBranchName = 'main',
  branchTag: initialBranchTag = 'production',
  onProjectClick,
  onBranchClick,
  onAvatarClick,
  avatarInitial = 'L',
  avatarColor = 'var(--avatar-background)',
  minimal = false,
  projectsList,
  branchesList: propsBranchesList,
  onSearchChange,
  ...props
}: AppBarProps) => {
  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [isBranchOpen, setIsBranchOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<{
    name: string
    tag: string
  }>({
    name: initialBranchName,
    tag: initialBranchTag,
  })

  // Create dummy branches data if not provided
  const dummyBranches: Branch[] = [
    { id: '1', name: 'main', tag: 'aaa' },
    { id: '2', name: 'develop', tag: 'staging' },
    { id: '3', name: 'feature/new-ui', tag: 'dev' },
    { id: '4', name: 'hotfix/login-issue', tag: 'fix' },
    { id: '5', name: 'release/v1.2.0', tag: 'release' },
    // Longer branch names for testing
    {
      id: '6',
      name: 'feature/implement-new-authentication-system-with-oauth2',
      tag: 'dev',
    },
    {
      id: '7',
      name: 'bugfix/fix-critical-issue-in-payment-processing-module',
      tag: 'fix',
    },
    {
      id: '8',
      name: 'release/v2.5.0-beta-with-new-features-and-improvements',
      tag: 'production',
    },
    {
      id: '9',
      name: 'hotfix/security-vulnerability-patch-urgent-deployment',
      tag: 'fix',
    },
    {
      id: '10',
      name: 'feature/user-interface-redesign-with-new-component-library',
      tag: 'dev',
    },
  ]

  // Create dummy projects data if not provided
  const dummyProjects: Project[] = [
    { id: '1', name: 'Liam HQ' },
    { id: '2', name: 'Dashboard' },
    { id: '3', name: 'API Service' },
    { id: '4', name: 'Mobile App' },
    { id: '5', name: 'Analytics Platform' },
    // Longer project names for testing
    {
      id: '6',
      name: 'Enterprise Resource Planning System Development Project',
    },
    { id: '7', name: 'Customer Relationship Management Platform Integration' },
    {
      id: '8',
      name: 'Mobile Application Development for Cross-Platform Deployment',
    },
    { id: '9', name: 'Data Analytics and Business Intelligence Dashboard' },
    {
      id: '10',
      name: 'Cloud Infrastructure Migration and Optimization Project',
    },
  ]

  // Use provided branches list or dummy data
  const branchesList = propsBranchesList || {
    branches: dummyBranches,
    onBranchSelect: (branch: Branch) => {
      // Update the selected branch
      setSelectedBranch({
        name: branch.name,
        tag: branch.tag || '',
      })

      // If onBranchClick is provided, call it
      if (onBranchClick) {
        onBranchClick()
      }
    },
  }

  // Use provided projects list or dummy data
  const projectsListData = projectsList || {
    projects: dummyProjects,
    onProjectSelect: (_selectedProject: Project) => {
      // If onProjectClick is provided, call it
      if (onProjectClick) {
        onProjectClick()
      }
    },
    onAddNewProject: () => {
      // If onProjectClick is provided, call it
      if (onProjectClick) {
        onProjectClick()
      }
    },
  }

  // handleProjectClick is no longer needed since we always show the projects dropdown

  const handleBranchClick = () => {
    if (branchesList) {
      // If branchesList is provided, toggle the dropdown
      setIsBranchOpen(!isBranchOpen)
    } else if (onBranchClick) {
      // If no branchesList but onBranchClick is provided, call it
      onBranchClick()
    }
  }

  if (minimal) {
    return (
      <div className={`${styles.appBar} ${styles.minimal}`} {...props}>
        <div className={styles.rightSection}>
          <Avatar
            initial={avatarInitial}
            size="sm"
            color={avatarColor}
            onClick={onAvatarClick}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.appBar} {...props}>
      <div className={styles.leftSection}>
        <div className={styles.breadcrumbs}>
          {/* Always show the projects dropdown with either provided or dummy data */}
          <DropdownMenuRoot
            open={isProjectOpen}
            onOpenChange={setIsProjectOpen}
          >
            <DropdownMenuTrigger asChild>
              <button type="button" className={styles.breadcrumbTrigger}>
                <BreadcrumbItem
                  label={project?.name || 'Project Name'}
                  icon={<ProjectIcon color="rgba(255, 255, 255, 0.2)" />}
                  isProject={true}
                  isActive={isProjectOpen}
                />
              </button>
            </DropdownMenuTrigger>
            <ProjectsDropdown
              projects={projectsListData.projects} // Display all projects
              selectedProjectId={project?.id}
              onProjectSelect={(selectedProject) => {
                projectsListData.onProjectSelect(selectedProject)
                setIsProjectOpen(false)
              }}
              onAddNewProject={() => {
                if (projectsListData.onAddNewProject) {
                  projectsListData.onAddNewProject()
                  setIsProjectOpen(false)
                }
              }}
            />
          </DropdownMenuRoot>
          <div className={styles.breadcrumbDivider}>
            <ChevronRight size={16} strokeWidth={1.5} />
          </div>
          {branchesList ? (
            <DropdownMenuRoot
              open={isBranchOpen}
              onOpenChange={setIsBranchOpen}
            >
              <DropdownMenuTrigger asChild>
                <button type="button" className={styles.breadcrumbTrigger}>
                  <BreadcrumbItem
                    label={selectedBranch.name}
                    tag={selectedBranch.tag}
                    isProject={false}
                    isActive={isBranchOpen}
                  />
                </button>
              </DropdownMenuTrigger>
              <BranchDropdown
                branches={branchesList.branches}
                selectedBranchId={
                  branchesList.branches.find(
                    (b) => b.name === selectedBranch.name,
                  )?.id
                }
                onBranchSelect={(selectedBranch: Branch) => {
                  branchesList.onBranchSelect(selectedBranch)
                  setIsBranchOpen(false)
                }}
              />
            </DropdownMenuRoot>
          ) : (
            <BreadcrumbItem
              label={selectedBranch.name}
              tag={selectedBranch.tag}
              onClick={handleBranchClick}
              isProject={false}
            />
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        <Avatar
          initial={avatarInitial}
          size="sm"
          color={avatarColor}
          onClick={onAvatarClick}
        />
      </div>
    </div>
  )
}

const BreadcrumbItem = forwardRef<HTMLButtonElement, BreadcrumbItemProps>(
  ({ label, tag, onClick, isActive = false, isProject = false }, ref) => {
    const textClassName = isProject
      ? `${styles.breadcrumbText} ${styles.projectText}`
      : `${styles.breadcrumbText} ${styles.branchText}`

    return (
      <button
        ref={ref}
        className={`${styles.breadcrumbItem} ${isActive ? styles.active : ''}`}
        onClick={onClick}
        type="button"
      >
        {isProject && (
          <div className={styles.breadcrumbIcon}>
            <ProjectIcon
              width={16}
              height={16}
              color="rgba(255, 255, 255, 0.2)"
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-1half)',
          }}
        >
          <span className={textClassName}>{label}</span>
          {tag === 'production' && (
            <div className={styles.branchTag}>{tag}</div>
          )}
        </div>
        <ChevronsUpDown
          size={12}
          strokeWidth={1.5}
          className={styles.chevronIcon}
        />
      </button>
    )
  },
)

BreadcrumbItem.displayName = 'BreadcrumbItem'
