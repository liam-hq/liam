import { createClient } from '@/libs/db/server'
import Link from 'next/link'
import type { FC } from 'react'
import styles from './ProjectsPage.module.css'

async function getProjects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('Project')
    .select('id, name, createdAt')
    .order('id', { ascending: false })

  return projects
}

export const ProjectsPage: FC = async () => {
  const projects = await getProjects()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <Link href="/app/projects/new" className={styles.createButton}>
          Create New Project
        </Link>
      </div>

      {projects === null || projects.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No projects found.</p>
          <p>Create a new project to get started.</p>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className={styles.projectCard}
            >
              <h2>{project.name || 'Untitled Project'}</h2>
              <p className={styles.createdAt}>Created: {project.createdAt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
