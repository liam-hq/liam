'use client'

import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import { useState, useTransition } from 'react'
import { linkSessionToProject } from './actions/linkSessionToProject'
import { useProjects } from './hooks/useProjects'

type Props = {
  sessionId: string
  onSuccess: () => void
}

export const ProjectSelector: FC<Props> = ({ sessionId, onSuccess }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const { projects, loading } = useProjects()

  const handleConnect = () => {
    if (!selectedProjectId) return

    startTransition(async () => {
      const result = await linkSessionToProject(sessionId, selectedProjectId)
      if (result.isOk()) {
        onSuccess()
      } else {
        console.error('Failed to link session to project:', result.error)
      }
    })
  }

  if (loading) return <div>Loading projects...</div>

  return (
    <div>
      <div>
        <label htmlFor="project-select">Select a project:</label>
        <select
          id="project-select"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">Choose a project...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleConnect}
        disabled={!selectedProjectId || isPending}
      >
        {isPending ? 'Connecting...' : 'Connect'}
      </Button>
    </div>
  )
}
