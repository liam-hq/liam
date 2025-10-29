import clsx from 'clsx'
import { type ChangeEvent, type FC, useId, useRef, useState } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { SessionFormActions } from '../../shared/SessionFormActions'
import styles from './PasteSessionFormPresenter.module.css'
import { useSchemaEditor } from './useSchemaEditor'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

const isFormatType = (value: string): value is FormatType => {
  return ['postgres', 'schemarb', 'prisma', 'tbls'].includes(value)
}

const usePasteForm = () => {
  const [schemaContent, setSchemaContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('postgres')

  const handleReset = () => {
    setSchemaContent('')
    setTextContent('')
    setSelectedFormat('postgres')
  }

  return {
    schemaContent,
    textContent,
    selectedFormat,
    setTextContent,
    setSelectedFormat,
    setSchemaContent,
    handleReset,
  }
}

export const PasteSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const initialMessageId = useId()
  const schemaContentId = useId()
  const formatSelectId = useId()
  const {
    schemaContent,
    textContent,
    selectedFormat,
    setTextContent,
    setSelectedFormat,
    setSchemaContent,
    handleReset,
  } = usePasteForm()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const { handleChange } = useAutoResizeTextarea(textareaRef)
  const handleTextareaChange = handleChange(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setTextContent(e.target.value)
    },
  )

  const handleSchemaEditorChange = (value: string) => {
    setSchemaContent(value)
  }

  const { ref: schemaEditorRef } = useSchemaEditor({
    value: schemaContent,
    onChange: handleSchemaEditorChange,
    disabled: isPending,
    format: selectedFormat,
  })

  const hasContent =
    schemaContent.trim().length > 0 || textContent.trim().length > 0

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
        <input type="hidden" name="schemaFormat" value={selectedFormat} />
        <input type="hidden" name="schemaContent" value={schemaContent} />
        <div className={styles.schemaSection}>
          <div className={styles.schemaInputWrapper}>
            <label htmlFor={schemaContentId} className={styles.label}>
              Schema Content
            </label>
            <div
              id={schemaContentId}
              ref={schemaEditorRef}
              className={clsx(
                styles.schemaEditorWrapper,
                isPending && styles.disabled,
              )}
            />
          </div>
          <div className={styles.formatSelectorWrapper}>
            <label htmlFor={formatSelectId} className={styles.formatLabel}>
              Schema Format
            </label>
            <select
              id={formatSelectId}
              value={selectedFormat}
              onChange={(e) => {
                const value = e.target.value
                if (isFormatType(value)) {
                  setSelectedFormat(value)
                }
              }}
              disabled={isPending}
              className={styles.formatSelect}
            >
              <option value="postgres">SQL (PostgreSQL)</option>
              <option value="schemarb">schema.rb (Ruby on Rails)</option>
              <option value="prisma">Prisma</option>
              <option value="tbls">TBLS</option>
            </select>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.inputSection}>
          <div className={styles.textareaWrapper}>
            <textarea
              ref={textareaRef}
              id={initialMessageId}
              name="initialMessage"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={textContent}
              onChange={handleTextareaChange}
              onKeyDown={handleEnterKeySubmission}
              className={styles.textarea}
              disabled={isPending}
              rows={4}
              aria-label="Initial message"
            />
            {formError && <p className={styles.error}>{formError}</p>}
          </div>
          <div className={styles.buttonContainer}>
            <SessionFormActions
              isPending={isPending}
              hasContent={hasContent}
              onCancel={handleReset}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
