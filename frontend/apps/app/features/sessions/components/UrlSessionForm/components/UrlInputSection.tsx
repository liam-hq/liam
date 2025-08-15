import { Button, RemoveButton } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from '../URLSessionFormPresenter/URLSessionFormPresenter.module.css'

type Props = {
  urlPath: string
  isPending: boolean
  canFetchSchema: boolean
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFetchSchema: () => void
  onRemoveSchema: () => void
}

export const UrlInputSection: FC<Props> = ({
  urlPath,
  isPending,
  canFetchSchema,
  onUrlChange,
  onKeyDown,
  onFetchSchema,
  onRemoveSchema,
}) => {
  return (
    <div className={styles.urlInputWrapper}>
      <div className={styles.inputContainer ?? ''}>
        <input
          id="schemaUrl"
          name="schemaUrl"
          type="text"
          value={urlPath}
          onChange={onUrlChange}
          onKeyDown={onKeyDown}
          placeholder="Enter schema file path (e.g., db/schema.rb)"
          disabled={isPending}
          className={styles.urlInput}
        />
        {urlPath && (
          <RemoveButton
            onClick={onRemoveSchema}
            variant="transparent"
            size="sm"
            className={styles.clearButton ?? ''}
            aria-label="Clear input"
          />
        )}
      </div>
      <Button
        type="button"
        variant={urlPath.trim() ? 'solid-primary' : 'outline-secondary'}
        size="md"
        disabled={isPending || !canFetchSchema}
        onClick={onFetchSchema}
      >
        Fetch Schema
      </Button>
    </div>
  )
}
