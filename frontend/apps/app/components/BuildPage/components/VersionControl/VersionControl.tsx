import { type FC, useState } from 'react'
import { Button, Input } from '@liam-hq/ui'
import { Clock, Plus } from 'lucide-react'
import styles from './VersionControl.module.css'

interface Version {
  id: string
  name: string
  timestamp: Date
  description: string
}

interface VersionControlProps {
  versions: Version[]
  currentVersionId: string | null
  onCreateVersion: (name: string, description: string) => void
  onSwitchVersion: (versionId: string) => void
}

export const VersionControl: FC<VersionControlProps> = ({
  versions,
  currentVersionId,
  onCreateVersion,
  onSwitchVersion,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [newVersionDescription, setNewVersionDescription] = useState('')

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle create version
  const handleCreateVersion = () => {
    if (newVersionName.trim() === '') return

    onCreateVersion(newVersionName, newVersionDescription)
    setNewVersionName('')
    setNewVersionDescription('')
    setIsCreateDialogOpen(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Versions</h3>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className={styles.icon} />
          New Version
        </Button>
      </div>

      <div className={styles.versionList}>
        {versions.map((version) => (
          <div
            key={version.id}
            className={`${styles.versionItem} ${version.id === currentVersionId ? styles.active : ''}`}
            onClick={() => onSwitchVersion(version.id)}
          >
            <div className={styles.versionInfo}>
              <div className={styles.versionName}>{version.name}</div>
              <div className={styles.versionTime}>
                <Clock className={styles.timeIcon} />
                {formatTime(version.timestamp)}
              </div>
            </div>
            {version.description && (
              <div className={styles.versionDescription}>{version.description}</div>
            )}
          </div>
        ))}
      </div>

      {isCreateDialogOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Create New Version</h4>
            </div>
            <div className={styles.dialogContent}>
            <div className={styles.inputGroup}>
              <label htmlFor="version-name" className={styles.label}>
                Version Name
              </label>
              <Input
                id="version-name"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Enter version name"
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="version-description" className={styles.label}>
                Description (optional)
              </label>
              <Input
                id="version-description"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="Enter version description"
              />
            </div>
          </div>
            <div className={styles.modalFooter}>
              <Button
                variant="outline-secondary"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="solid-primary"
                onClick={handleCreateVersion}
                disabled={newVersionName.trim() === ''}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
