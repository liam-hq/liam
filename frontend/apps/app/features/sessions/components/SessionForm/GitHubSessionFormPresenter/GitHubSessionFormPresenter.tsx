import { ArrowTooltipProvider } from '@liam-hq/ui'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import type { Branch } from '../BranchesDropdown'
import { BranchesDropdown } from '../BranchesDropdown'
import { ProjectsDropdown } from '../ProjectsDropdown'
import { SchemaDisplay } from '../SchemaDisplay'
import { SessionFormActions } from '../SessionFormActions'
import styles from './GitHubSessionFormPresenter.module.css'

type Props = {
  projects: Projects
  defaultProjectId?: string
  branches: Branch[]
  isBranchesLoading: boolean
  branchesError?: string
  formError?: string
  isPending: boolean
  onProjectChange: (projectId: string) => void
  formAction: (formData: FormData) => void
}

export const GitHubSessionFormPresenter: FC<Props> = ({
  projects,
  defaultProjectId,
  branches,
  isBranchesLoading,
  branchesError,
  formError,
  isPending,
  onProjectChange,
  formAction,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hasContent, setHasContent] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || '',
  )
  const [selectedBranchSha, setSelectedBranchSha] = useState('')

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
    setHasContent(textarea.value.trim().length > 0)
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  // Reset hasContent when form submission completes
  useEffect(() => {
    if (!isPending && textareaRef.current) {
      setHasContent(textareaRef.current.value.trim().length > 0)
    }
  }, [isPending])

  const hasError = !!formError || !!branchesError

  return (
    <ArrowTooltipProvider>
      <div
        className={`${styles.container} ${isPending ? styles.pending : ''} ${hasError ? styles.error : ''}`}
      >
        <form action={formAction}>
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <textarea
                  id="initialMessage"
                  name="initialMessage"
                  ref={textareaRef}
                  onChange={handleTextareaChange}
                  placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
                  disabled={isPending}
                  className={styles.textarea}
                  rows={6}
                  aria-label="Initial message for database design"
                />
                {formError && <p className={styles.error}>{formError}</p>}
                {branchesError && (
                  <p className={styles.error}>{branchesError}</p>
                )}
              </div>
            </div>
          </div>
          <div className={styles.buttonContainer}>
            <div className={styles.dropdowns}>
              <input type="hidden" name="projectId" value={selectedProjectId} />
              <ProjectsDropdown
                projects={projects}
                selectedProjectId={selectedProjectId}
                onProjectChange={(projectId) => {
                  setSelectedProjectId(projectId)
                  onProjectChange(projectId)
                }}
                disabled={isPending}
              />
              {branches.length > 0 && (
                <>
                  <input
                    type="hidden"
                    name="gitSha"
                    value={selectedBranchSha}
                  />
                  <BranchesDropdown
                    branches={branches}
                    selectedBranchSha={selectedBranchSha}
                    onBranchChange={setSelectedBranchSha}
                    disabled={isPending}
                    isLoading={isBranchesLoading}
                  />
                  <SchemaDisplay schemaName="database.sql" />
                </>
              )}
            </div>
            <SessionFormActions
              isPending={isPending}
              hasContent={hasContent}
              onCancel={() => window.location.reload()}
            />
          </div>
        </form>
      </div>
    </ArrowTooltipProvider>
  )
}
