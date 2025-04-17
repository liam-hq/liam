import { ChevronRight, ChevronsUpDown } from '@/icons'
import { createClient } from '@/libs/db/server'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import { Avatar } from '@liam-hq/ui'
import type { ComponentProps, ReactNode } from 'react'
import { headers } from 'next/headers'
import styles from './AppBar.module.css'

async function getProject(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: project, error } = await supabase
      .from('Project')
      .select('id, name, createdAt, updatedAt, organizationId')
      .eq('id', Number(projectId))
      .single()

    if (error || !project) {
      console.error('Error fetching project:', error)
      return null
    }

    return project
  } catch (error) {
    console.error('Error in getProject:', error)
    return null
  }
}

type BreadcrumbItemProps = {
  label: string
  icon?: ReactNode | undefined
  tag?: string | undefined
  onClick?: (() => void) | undefined
  isActive?: boolean
  isProject?: boolean
}

type AppBarProps = {
  projectId?: string
  branchName?: string
  branchTag?: string
  onProjectClick?: () => void
  onBranchClick?: () => void
  onAvatarClick?: () => void
  avatarInitial?: string
  avatarColor?: string
  minimal?: boolean

} & ComponentProps<'div'>

export async function AppBar({
  projectId,
  branchName = 'main',
  branchTag = 'production',
  onProjectClick,
  onBranchClick,
  onAvatarClick,
  avatarInitial = 'L',
  avatarColor = 'var(--avatar-background)',
  minimal = false,
  ...props
}: AppBarProps) {
  let pathname = ''
  try {
    const headersList = headers() as any
    pathname = headersList.get?.('x-pathname') || ''
  } catch (error) {
    console.error('Error getting pathname from headers:', error)
  }
  
  let extractedProjectId = projectId
  if (!extractedProjectId && pathname) {
    const projectsPattern = /\/app\/projects\/(\d+)(?:\/|$)/
    const match = pathname.match(projectsPattern)
    extractedProjectId = match?.[1]
  }
  
  const project = extractedProjectId ? await getProject(extractedProjectId) : undefined
  
  const isMinimal = minimal || !pathname.includes('/projects/')

  if (minimal || isMinimal) {
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
          <BreadcrumbItem
            label={project?.name || 'Project Name'}
            icon={<ProjectIcon />}
            onClick={onProjectClick}
            isProject={true}
          />
          <div className={styles.breadcrumbDivider}>
            <ChevronRight size={16} strokeWidth={1.5} />
          </div>
          <BreadcrumbItem
            label={branchName}
            tag={branchTag}
            onClick={onBranchClick}
            isProject={false}
          />
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

const BreadcrumbItem = ({
  label,
  icon,
  tag,
  onClick,
  isActive = false,
  isProject = false,
}: BreadcrumbItemProps) => {
  const textClassName = isProject
    ? `${styles.breadcrumbText} ${styles.projectText}`
    : `${styles.breadcrumbText} ${styles.branchText}`

  return (
    <button
      className={`${styles.breadcrumbItem} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      type="button"
    >
      {icon && <div className={styles.breadcrumbIcon}>{icon}</div>}
      <span className={textClassName}>{label}</span>
      {tag && <div className={styles.branchTag}>{tag}</div>}
      <ChevronsUpDown
        size={12}
        strokeWidth={1.5}
        className={styles.chevronIcon}
      />
    </button>
  )
}

const ProjectIcon = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Project Icon</title>
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="4"
        fill="var(--color-gray-500)"
      />
    </svg>
  )
}
