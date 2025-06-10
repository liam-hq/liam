import { ArrowRight, Button } from '@liam-hq/ui'
import type { Meta } from '@storybook/react'
import type React from 'react'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import styles from './SessionsNewPage.module.css'

// Mock projects data type
type Projects = Array<{
  id: string
  name: string
}>

type Props = {
  projects: Projects | null
}

// Simplified SessionsNewPage component for Storybook (without Server Actions)
const SessionsNewPageStorybook: FC<Props> = ({ projects }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [initialMessage, setInitialMessage] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [showBranches, setShowBranches] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setInitialMessage(textarea.value)
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const handleProjectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(e.target.value)
    setShowBranches(e.target.value !== '')
  }

  const isFormValid = initialMessage.trim().length > 0

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Form submitted! (This is a Storybook demo)')
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>What can I help you Database Design?</h1>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <label htmlFor="project" className={styles.label}>
                  Project (Optional)
                </label>
                <select
                  id="project"
                  name="projectId"
                  value={selectedProject}
                  onChange={handleProjectChange}
                  className={styles.select}
                >
                  <option value="">Select a project...</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {showBranches && (
                <div className={styles.formGroup}>
                  <label htmlFor="branch" className={styles.label}>
                    Branch
                  </label>
                  <select id="branch" name="gitSha" className={styles.select}>
                    <option value="">Select a branch...</option>
                    <option value="main">main</option>
                    <option value="develop">develop</option>
                    <option value="feature/new-feature">
                      feature/new-feature
                    </option>
                    <option value="production">production (production)</option>
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="initialMessage" className={styles.label}>
                  Initial Message *
                </label>
                <div className={styles.inputWrapper}>
                  <textarea
                    id="initialMessage"
                    name="initialMessage"
                    ref={textareaRef}
                    value={initialMessage}
                    onChange={handleChange}
                    placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
                    className={styles.textarea}
                    rows={6}
                    aria-label="Initial message for database design"
                    required
                  />
                </div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.buttonContainer}>
              <Button
                type="submit"
                variant="solid-primary"
                disabled={!isFormValid}
                className={styles.buttonCustom}
              >
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Mock projects data
const _mockProjects: Projects = [
  {
    id: '1',
    name: 'E-commerce Platform',
  },
  {
    id: '2',
    name: 'Blog System',
  },
  {
    id: '3',
    name: 'User Management API',
  },
]

const meta: Meta<typeof SessionsNewPageStorybook> = {
  title: 'Pages/SessionsNewPage',
  component: SessionsNewPageStorybook,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A page component for creating new database design sessions. Users can optionally select a project and branch, then provide an initial message to start the design session. This is a Storybook-compatible version without Server Actions.',
      },
      story: {
        inline: false,
        iframeHeight: 800,
      },
    },
  },
}

export default meta

// Default state
export const Default = () => <SessionsNewPageStorybook projects={null} />
