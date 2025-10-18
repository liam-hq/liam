import { ArrowTooltipProvider } from '@liam-hq/ui'
import clsx from 'clsx'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import type { Projects } from '../../../../../components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { SessionFormActions } from '../../shared/SessionFormActions'
import type { Branch } from '../BranchesDropdown'
import { BranchesDropdown } from '../BranchesDropdown'
import { ProjectsDropdown } from '../ProjectsDropdown'
import { SchemaDisplay } from '../SchemaDisplay'
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
  isTransitioning?: boolean
  schemaFilePath: string | null
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
  isTransitioning = false,
  schemaFilePath,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [hasContent, setHasContent] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || '',
  )
  const initialMessageId = useId()
  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
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
        className={clsx(
          styles.container,
          isPending && styles.pending,
          hasError && styles.error,
        )}
      >
        <form
          ref={formRef}
          action={formAction}
          style={createAccessibleOpacityTransition(!isTransitioning)}
        >
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <textarea
                  id={initialMessageId}
                  name="initialMessage"
                  ref={textareaRef}
                  onChange={handleTextareaChange}
                  onKeyDown={handleEnterKeySubmission}
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
                  <SchemaDisplay
                    schemaName={
                      schemaFilePath
                        ? schemaFilePath.split('/').pop() || 'database.sql'
                        : 'database.sql'
                    }
                  />
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
