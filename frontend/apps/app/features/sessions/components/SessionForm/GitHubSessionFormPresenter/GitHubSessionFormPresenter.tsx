import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import {
  ArrowRight,
  ArrowTooltipContent,
  ArrowTooltipPortal,
  ArrowTooltipProvider,
  ArrowTooltipRoot,
  ArrowTooltipTrigger,
  Button,
} from '@liam-hq/ui'
import type { ChangeEvent, FC } from 'react'
import { useEffect, useRef } from 'react'
import styles from './GitHubSessionFormPresenter.module.css'

type Branch = {
  name: string
  sha: string
  protected: boolean
}

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

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  return (
    <ArrowTooltipProvider>
      <div className={styles.container}>
        <form action={formAction}>
          <div className={styles.formContent}>
            <div className={styles.formGroup}>
              <label htmlFor="project" className={styles.label}>
                Project (Optional)
              </label>
              <select
                id="project"
                name="projectId"
                defaultValue={defaultProjectId || ''}
                onChange={(e) => onProjectChange(e.target.value)}
                disabled={isPending}
                className={styles.select}
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {branches.length > 0 && (
              <div className={styles.formGroup}>
                <label htmlFor="branch" className={styles.label}>
                  Branch
                </label>
                <select
                  id="branch"
                  name="gitSha"
                  disabled={isPending || isBranchesLoading}
                  className={styles.select}
                >
                  <option value="">Select a branch...</option>
                  {branches.map((branch) => (
                    <option key={branch.sha} value={branch.sha}>
                      {branch.name}
                      {branch.protected && ' (production)'}
                    </option>
                  ))}
                </select>
                {isBranchesLoading && (
                  <p className={styles.loading}>Loading branches...</p>
                )}
                {branchesError && (
                  <p className={styles.error}>{branchesError}</p>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="initialMessage" className={styles.label}>
                Initial message *
              </label>
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
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.buttonContainer}>
            <ArrowTooltipRoot>
              <ArrowTooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="solid-primary"
                  disabled={isPending}
                  isLoading={isPending}
                  className={styles.buttonCustom}
                  loadingIndicatorType="content"
                >
                  <ArrowRight size={16} />
                </Button>
              </ArrowTooltipTrigger>
              <ArrowTooltipPortal>
                <ArrowTooltipContent side="top" align="center">
                  Send
                </ArrowTooltipContent>
              </ArrowTooltipPortal>
            </ArrowTooltipRoot>
          </div>
        </form>
      </div>
    </ArrowTooltipProvider>
  )
}
