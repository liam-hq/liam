'use client'
import { urlgen } from '@/libs/routes'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import Link from 'next/link'
import { useState } from 'react'
import styles from '../../ProjectsPage.module.css'
import type { ProjectWithLastCommit } from '../../types'
import { EmptyProjectsState } from '../EmptyProjectsState'
import { ProjectItem } from './components/ProjectItem'
import { SearchInput } from './components/SearchInput'
import { SortDropdown, type SortOption } from './components/SortDropdown'
import { useProjectSearch } from './hooks/useProjectSearch'

/**
 * Type predicate to check if a project has the properties of a ProjectWithLastCommit
 */
const isProjectWithLastCommit = (
  project: Tables<'projects'> | ProjectWithLastCommit,
): project is ProjectWithLastCommit => {
  return 'lastCommitDate' in project
}

interface ProjectsListViewProps {
  initialProjects: (Tables<'projects'> | ProjectWithLastCommit)[] | null
  organizationId?: string
}

/**
 * Client component for displaying, searching, and sorting projects
 * Receives projects with commit data from the server component
 */
export function ProjectsListView({
  initialProjects,
  organizationId,
}: ProjectsListViewProps) {
  const [sortOption, setSortOption] = useState<SortOption>('activity')
  const { searchResult, searchProjects } = useProjectSearch(
    organizationId,
    initialProjects,
  )

  const { projects: unsortedProjects, loading } = searchResult

  // Sort projects based on the selected sort option
  const projects = unsortedProjects
    ? [...unsortedProjects].sort((a, b) => {
        if (sortOption === 'name') {
          return a.name.localeCompare(b.name)
        }

        // Use lastCommitDate if available (from server pre-processing)
        const aLastCommitDate = isProjectWithLastCommit(a)
          ? a.lastCommitDate
          : undefined
        const bLastCommitDate = isProjectWithLastCommit(b)
          ? b.lastCommitDate
          : undefined

        return (
          new Date(
            bLastCommitDate || b.updated_at || b.created_at || 0,
          ).getTime() -
          new Date(
            aLastCommitDate || a.updated_at || a.created_at || 0,
          ).getTime()
        )
      })
    : unsortedProjects

  return (
    <div className={styles.projectsContainer}>
      <div className={styles.projectsHeader}>
        <SearchInput
          onSearch={searchProjects}
          loading={loading}
          placeholder="Search Projects..."
        />

        <SortDropdown
          initialSortOption={sortOption}
          onSortChange={setSortOption}
        />

        <Link
          href={
            organizationId
              ? urlgen('projects/new')
              : urlgen('organizations/new')
          }
          className={styles.newProjectButton}
        >
          New Project
        </Link>
      </div>

      {projects === null || projects.length === 0 ? (
        <EmptyProjectsState projects={projects} />
      ) : (
        <div className={styles.projectsGrid}>
          {projects.map((project) => (
            <ProjectItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
