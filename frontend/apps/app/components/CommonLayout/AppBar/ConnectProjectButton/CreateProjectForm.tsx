'use client'

import { Button } from '@liam-hq/ui'
import type { FC } from 'react'

type Props = {
  onSuccess: () => void
}

export const CreateProjectForm: FC<Props> = ({ onSuccess }) => {
  const handleCreateProject = () => {
    window.open('/app/projects/new', '_blank')
    onSuccess()
  }

  return (
    <div>
      <p>Create a new project to connect with this session.</p>
      <Button onClick={handleCreateProject}>Create New Project</Button>
    </div>
  )
}
