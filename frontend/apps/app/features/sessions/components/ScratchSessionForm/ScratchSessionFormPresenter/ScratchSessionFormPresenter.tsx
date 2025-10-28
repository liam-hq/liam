import clsx from 'clsx'
import { type ChangeEvent, type FC, useRef, useState } from 'react'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { SessionFormActions } from '../../shared/SessionFormActions'
import styles from './ScratchSessionFormPresenter.module.css'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

export const ScratchSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const [textContent, setTextContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const hasContent = textContent.trim().length > 0

  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

  const { handleChange } = useAutoResizeTextarea(textareaRef)
  const handleTextareaChange = handleChange(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setTextContent(e.target.value)
    },
  )

  const handleReset = () => {
    setTextContent('')
  }

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
        <div className={styles.inputSection}>
          <div className={styles.textareaWrapper}>
            <textarea
              ref={textareaRef}
              name="initialMessage"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={textContent}
              onChange={handleTextareaChange}
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
              onCancel={handleReset}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
