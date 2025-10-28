import clsx from 'clsx'
import { type ChangeEvent, type FC, useId, useRef, useState } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { FormatSelectDropdown } from '../../shared/FormatSelectDropdown'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { SessionFormActions } from '../../shared/SessionFormActions'
import styles from './PasteSchemaSessionFormPresenter.module.css'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

const usePasteFormState = () => {
  const [schemaContent, setSchemaContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('postgres')

  return {
    schemaContent,
    setSchemaContent,
    textContent,
    setTextContent,
    selectedFormat,
    setSelectedFormat,
  }
}

const usePasteFormHandlers = (state: ReturnType<typeof usePasteFormState>) => {
  const { setSchemaContent, setTextContent, setSelectedFormat } = state

  const handleResetForm = () => {
    setSchemaContent('')
    setTextContent('')
    setSelectedFormat('postgres')
  }

  return {
    handleResetForm,
  }
}

export const PasteSchemaSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const schemaTextareaId = useId()
  const state = usePasteFormState()
  const schemaTextareaRef = useRef<HTMLTextAreaElement>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handlers = usePasteFormHandlers(state)

  const { handleChange: handleSchemaChange } =
    useAutoResizeTextarea(schemaTextareaRef)
  const handleSchemaTextareaChange = handleSchemaChange(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      state.setSchemaContent(e.target.value)
    },
  )

  const { handleChange: handleMessageChange } =
    useAutoResizeTextarea(messageTextareaRef)
  const handleMessageTextareaChange = handleMessageChange(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      state.setTextContent(e.target.value)
    },
  )

  const hasContent =
    state.schemaContent.trim().length > 0 || state.textContent.trim().length > 0

  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

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
        className={styles.form}
        style={createAccessibleOpacityTransition(!isTransitioning)}
      >
        <input type="hidden" name="schemaContent" value={state.schemaContent} />
        <input type="hidden" name="schemaFormat" value={state.selectedFormat} />
        <div className={styles.inputSection}>
          <div className={styles.schemaSection}>
            <div className={styles.schemaSectionHeader}>
              <label htmlFor={schemaTextareaId} className={styles.label}>
                Paste your schema
              </label>
              <FormatSelectDropdown
                selectedFormat={state.selectedFormat}
                onFormatChange={state.setSelectedFormat}
              />
            </div>
            <textarea
              ref={schemaTextareaRef}
              id={schemaTextareaId}
              placeholder="Paste your schema here (SQL, schema.rb, Prisma, or TBLS JSON format)..."
              value={state.schemaContent}
              onChange={handleSchemaTextareaChange}
              className={styles.schemaTextarea}
              disabled={isPending}
              rows={8}
            />
          </div>
        </div>
        <div className={styles.divider} />
        <div className={clsx(styles.inputSection)}>
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
              onCancel={handlers.handleResetForm}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
