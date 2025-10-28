import clsx from 'clsx'
import { type ChangeEvent, type FC, useId, useRef, useState } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import {
  SchemaInfoSection,
  type SchemaStatus,
} from '../../GitHubSessionForm/SchemaInfoSection'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { SessionFormActions } from '../../shared/SessionFormActions'
import styles from './PasteSessionFormPresenter.module.css'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

const usePasteFormState = () => {
  const [schemaContent, setSchemaContent] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('postgres')
  const [textContent, setTextContent] = useState('')
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')

  return {
    schemaContent,
    setSchemaContent,
    selectedFormat,
    setSelectedFormat,
    textContent,
    setTextContent,
    schemaStatus,
    setSchemaStatus,
  }
}

const usePasteFormHandlers = (state: ReturnType<typeof usePasteFormState>) => {
  const {
    setSchemaContent,
    setSelectedFormat,
    setTextContent,
    setSchemaStatus,
  } = state

  const handleReset = () => {
    setSchemaContent('')
    setSelectedFormat('postgres')
    setTextContent('')
    setSchemaStatus('idle')
  }

  const handleSchemaContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setSchemaContent(content)
    if (content.trim()) {
      setSchemaStatus('valid')
    } else {
      setSchemaStatus('idle')
    }
  }

  return {
    handleReset,
    handleSchemaContentChange,
  }
}

export const PasteSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const schemaContentId = useId()
  const state = usePasteFormState()
  const schemaTextareaRef = useRef<HTMLTextAreaElement>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handlers = usePasteFormHandlers(state)

  const hasContent =
    state.schemaContent.trim().length > 0 || state.textContent.trim().length > 0

  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

  const { handleChange: handleSchemaChange } =
    useAutoResizeTextarea(schemaTextareaRef)
  const handleSchemaTextareaChange = handleSchemaChange(
    handlers.handleSchemaContentChange,
  )

  const { handleChange: handleMessageChange } =
    useAutoResizeTextarea(messageTextareaRef)
  const handleMessageTextareaChange = handleMessageChange((e) => {
    state.setTextContent(e.target.value)
  })

  return (
    <div
      className={clsx(
        styles.container,
        isPending && styles.pending,
        formError && styles.error,
      )}
    >
      <form
        ref={formRef}
        action={formAction}
        style={createAccessibleOpacityTransition(!isTransitioning)}
      >
        <input type="hidden" name="schemaContent" value={state.schemaContent} />
        <input type="hidden" name="schemaFormat" value={state.selectedFormat} />
        <div className={styles.schemaSection}>
          <label htmlFor={schemaContentId} className={styles.label}>
            Paste your schema
          </label>
          <textarea
            ref={schemaTextareaRef}
            id={schemaContentId}
            placeholder="Paste your schema here (SQL, schema.rb, Prisma, or TBLS JSON format)..."
            value={state.schemaContent}
            onChange={handleSchemaTextareaChange}
            className={styles.schemaTextarea}
            disabled={isPending}
            rows={8}
          />
          {state.schemaStatus !== 'idle' && (
            <SchemaInfoSection
              status={state.schemaStatus}
              schemaName="pasted-schema"
              detectedFormat={state.selectedFormat}
              selectedFormat={state.selectedFormat}
              onFormatChange={state.setSelectedFormat}
              onRemove={() => {
                state.setSchemaContent('')
                state.setSchemaStatus('idle')
              }}
              variant="simple"
              showRemoveButton={false}
            />
          )}
        </div>
        <div className={styles.divider} />
        <div className={styles.inputSection}>
          <div className={styles.textareaWrapper}>
            <textarea
              ref={messageTextareaRef}
              name="initialMessage"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={state.textContent}
              onChange={handleMessageTextareaChange}
              onKeyDown={handleEnterKeySubmission}
              className={styles.textarea}
              disabled={isPending}
              rows={4}
            />
            {formError && <p className={styles.error}>{formError}</p>}
          </div>
          <div className={styles.buttonContainer}>
            <SessionFormActions
              isPending={isPending}
              hasContent={hasContent}
              onCancel={handlers.handleReset}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
