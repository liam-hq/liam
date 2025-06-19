import { Button } from '@liam-hq/ui'
import {
  type ChangeEvent,
  type DragEvent,
  type FC,
  useRef,
  useState,
} from 'react'
import { SessionFormActions } from '../SessionFormActions'
import styles from './UploadSessionFormPresenter.module.css'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
}

export const UploadSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    if (e.dataTransfer.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={styles.container}>
      <form action={formAction}>
        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <div
              className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              {/* biome-ignore lint/a11y/useSemanticElements: div required for drag-and-drop functionality */}
              role="button"
              tabIndex={0}
            >
              <div className={styles.dropZoneContent}>
                <p className={styles.dropZoneText}>
                  Drag & drop your schema file or click to upload
                </p>
                <p className={styles.dropZoneSubtext}>
                  Supported formats: .sql, .rb, .prisma, .json, .yaml
                </p>
                <Button
                  type="button"
                  variant="solid-primary"
                  onClick={handleSelectFile}
                  className={styles.selectFileButton}
                >
                  Select File
                </Button>
                {selectedFile && (
                  <p className={styles.selectedFile}>
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                name="schemaFile"
                onChange={handleFileSelect}
                accept=".sql,.rb,.prisma,.json,.yaml,.yml"
                className={styles.hiddenFileInput}
              />
            </div>
            {formError && <p className={styles.error}>{formError}</p>}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.buttonContainer}>
          <SessionFormActions isPending={isPending || !selectedFile} />
        </div>
      </form>
    </div>
  )
}
