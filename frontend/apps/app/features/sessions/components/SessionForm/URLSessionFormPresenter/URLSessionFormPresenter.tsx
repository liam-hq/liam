import { Button } from '@liam-hq/ui'
import { type FC, useId, useState } from 'react'
import { SessionFormActions } from '../SessionFormActions'
import styles from './URLSessionFormPresenter.module.css'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
}

export const URLSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
}) => {
  const [urlPath, setUrlPath] = useState('')
  const schemaUrlId = useId()

  return (
    <div className={styles.container}>
      <form action={formAction}>
        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <label htmlFor={schemaUrlId} className={styles.label}>
              Enter schema file path (e.g., db/schema.rb)
            </label>
            <div className={styles.urlInputWrapper}>
              <input
                id={schemaUrlId}
                name="schemaUrl"
                type="text"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                placeholder="Enter schema file path (e.g., db/schema.rb)"
                disabled={isPending}
                className={styles.urlInput}
              />
              <Button
                type="button"
                variant="solid-primary"
                disabled={!urlPath.trim() || isPending}
                className={styles.fetchButton}
              >
                Fetch Schema
              </Button>
            </div>
            {formError && <p className={styles.error}>{formError}</p>}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.buttonContainer}>
          <SessionFormActions isPending={isPending || !urlPath.trim()} />
        </div>
      </form>
    </div>
  )
}
