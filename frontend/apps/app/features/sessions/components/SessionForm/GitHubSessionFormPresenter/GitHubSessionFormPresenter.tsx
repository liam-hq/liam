import { ArrowTooltipProvider } from '@liam-hq/ui'
import clsx from 'clsx'
import type { ChangeEvent, DragEvent, FC } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { AttachmentPreview } from '../AttachmentPreview'
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
  const initialMessageId = useId()
  const [hasContent, setHasContent] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || '',
  )
  const [selectedBranchSha, setSelectedBranchSha] = useState('')
  const [attachments, setAttachments] = useState<
    { id: string; url: string; name: string }[]
  >([])
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (files: FileList) => {
    const newAttachments = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    setAttachments((prev) => [...prev, ...newAttachments])
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].url)
      updated.splice(index, 1)
      return updated
    })
  }

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
          dragActive && styles.dragActive,
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <form action={formAction}>
          <div className={styles.formContent}>
            {attachments.length > 0 && (
              <div className={styles.attachmentsContainer}>
                {attachments.map((attachment, index) => (
                  <AttachmentPreview
                    key={attachment.id}
                    src={attachment.url}
                    alt={attachment.name}
                    onRemove={() => handleRemoveAttachment(index)}
                  />
                ))}
              </div>
            )}
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <textarea
                  id={initialMessageId}
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
              onFileSelect={handleFileSelect}
              onCancel={() => window.location.reload()}
            />
          </div>
        </form>
      </div>
    </ArrowTooltipProvider>
  )
}
