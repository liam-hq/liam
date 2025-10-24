import { ArrowTooltipProvider } from '@liam-hq/ui'
import clsx from 'clsx'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import type { Projects } from '../../../../../components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import {
  type Branch,
  BranchCombobox,
} from '../../../../../components/shared/BranchCombobox'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { SessionFormActions } from '../../shared/SessionFormActions'
import { ProjectsDropdown } from '../ProjectsDropdown'
import styles from './GitHubSessionFormPresenter.module.css'
import { SchemaSetupNotice } from './SchemaSetupNotice'

type Props = {
  projects: Projects
  defaultProjectId?: string
  branches: Branch[]
  isBranchesLoading: boolean
  isBranchesError?: boolean
  formError?: string
  isPending: boolean
  onProjectChange: (projectId: string) => void
  formAction: (formData: FormData) => void
  schemaFilePath: string | null
  isSchemaPathLoading?: boolean
}

export const GitHubSessionFormPresenter: FC<Props> = ({
  projects,
  defaultProjectId,
  branches,
  isBranchesLoading,
  isBranchesError,
  formError,
  isPending,
  onProjectChange,
  formAction,
  schemaFilePath,
  isSchemaPathLoading,
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

  const isSchemaFilePathUnset =
    selectedProjectId !== '' &&
    !isSchemaPathLoading &&
    (schemaFilePath === null || schemaFilePath === '')

  const hasError = !!formError || isBranchesError || isSchemaFilePathUnset

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
          className={styles.form}
          style={createAccessibleOpacityTransition(true)}
        >
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
          </div>
          <div className={styles.buttonsWrapper}>
            {isSchemaFilePathUnset && (
              <SchemaSetupNotice projectId={selectedProjectId} />
            )}

            <div className={styles.buttons}>
              <div className={styles.dropdowns}>
                <input
                  type="hidden"
                  name="projectId"
                  value={selectedProjectId}
                />
                <ProjectsDropdown
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onProjectChange={(projectId) => {
                    setSelectedProjectId(projectId)
                    onProjectChange(projectId)
                  }}
                  disabled={isPending}
                />

                <input type="hidden" name="gitSha" value={selectedBranchSha} />
                <BranchCombobox
                  branches={branches}
                  selectedBranchSha={selectedBranchSha}
                  disabled={isPending}
                  isLoading={isBranchesLoading}
                  isError={isBranchesError}
                  onBranchChange={setSelectedBranchSha}
                />
              </div>
              <SessionFormActions
                isPending={isPending}
                hasContent={hasContent}
                onCancel={() => window.location.reload()}
              />
            </div>
          </div>
        </form>
      </div>
    </ArrowTooltipProvider>
  )
}
