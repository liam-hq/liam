'use client'

import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components'
import { ProjectIcon } from '@/components/ProjectsPage/components/ProjectsListView/components/ProjectItem/ProjectIcon'
import { ChevronsUpDown } from '@/icons'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import styles from './SessionsNewPage.module.css'

type Project = {
  id: string
  name: string
}

type Props = {
  projectId?: string
}

const ApiSessionsCreateSchema = v.object({
  success: v.boolean(),
  designSession: v.object({
    id: v.string(),
  }),
})

export const SessionsNewPage: FC<Props> = ({ projectId: initialProjectId }) => {
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId)
  const [projects, setProjects] = useState<Project[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      }
    }
    fetchProjects()
  }, [])

  const createSession = useCallback(async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/design-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      const result = v.safeParse(ApiSessionsCreateSchema, data)

      if (!result.success) {
        throw new Error('Invalid response format')
      }

      if (result.output.success) {
        router.push(`/app/design_sessions/${result.output.designSession.id}`)
      } else {
        throw new Error('Session creation failed')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      setIsCreating(false)
    }
  }, [selectedProjectId, router])

  const handleCreateSession = useCallback(() => {
    createSession()
  }, [createSession])

  if (isCreating) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Creating Session ...</h1>
          <p className={styles.subtitle}>
            {selectedProjectId 
              ? `Creating a new session for selected project`
              : 'Creating a new session without project'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>New Design Session</h1>
        <p className={styles.subtitle}>
          Choose a project to start with its schema, or create without a project for an empty schema.
        </p>
      </div>
      
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Project (Optional)</label>
          <DropdownMenuRoot>
            <DropdownMenuTrigger className={styles.trigger}>
              <div className={styles.iconAndName}>
                <ProjectIcon className={styles.projectIcon} />
                <span className={styles.projectName}>
                  {selectedProjectId 
                    ? projects.find(p => p.id === selectedProjectId)?.name || 'Select Project'
                    : 'No Project Selected'
                  }
                </span>
              </div>
              <ChevronsUpDown className={styles.chevronIcon} />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="start" sideOffset={5} className={styles.content}>
                <DropdownMenuRadioGroup
                  value={selectedProjectId || ''}
                  onValueChange={(value) => setSelectedProjectId(value || undefined)}
                >
                  <DropdownMenuRadioItem value="" label="No Project" />
                  {projects.map((project) => (
                    <DropdownMenuRadioItem 
                      key={project.id} 
                      value={project.id} 
                      label={project.name} 
                    />
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>
        
        <button 
          className={styles.createButton}
          onClick={handleCreateSession}
          type="button"
        >
          Create Session
        </button>
      </div>
    </div>
  )
}
