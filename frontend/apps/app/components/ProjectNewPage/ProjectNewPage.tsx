'use client'

import type { Installation, Repository } from '@liam-hq/github'
import { ArrowLeft, Button } from '@liam-hq/ui'
import type { FormatType } from 'components/FormatIcon'
import Link from 'next/link'
import { type FC, useCallback, useState, useTransition } from 'react'
import { urlgen } from '../../libs/routes'
import { TokenRefreshKick } from '../TokenRefreshKick'
import { addProject } from './actions/addProject'
import { InstallationSelector } from './components/InstallationSelector'
import { SetSchemaForm } from './components/SetSchemaForm'
import { type Step, Stepper } from './components/Stepper'
import styles from './ProjectNewPage.module.css'

const steps: Step[] = [
  { label: 'Import Git Repository' },
  { label: 'Set Watch Schemas' },
]

type Props = {
  installations: Installation[]
  needsRefresh?: boolean
}

export const ProjectNewPage: FC<Props> = ({ installations, needsRefresh }) => {
  const [selectedInstallation, setSelectedInstallation] =
    useState<Installation | null>(() => {
      if (needsRefresh) {
        return null
      }

      return installations[0] ?? null
    })
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null)
  const [schemaFilePath, setSchemaFilePath] = useState<string>('')
  const [schemaFileFormat, setSchemaFileFormat] =
    useState<FormatType>('postgres')

  const handleCancel = useCallback(() => {
    setSelectedRepository(null)
  }, [])

  const [isPending, startTransition] = useTransition()
  const handleSave = useCallback(async () => {
    if (!selectedRepository || !selectedInstallation) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('projectName', selectedRepository.name)
        formData.set('repositoryName', selectedRepository.name)
        formData.set('repositoryOwner', selectedRepository.owner.login)
        formData.set('installationId', selectedInstallation.id.toString())
        formData.set('repositoryIdentifier', selectedRepository.id.toString())
        formData.set('schemaFilePath', schemaFilePath)
        formData.set('schemaFormat', schemaFileFormat)

        await addProject(formData)
      } catch (error) {
        console.error('Error adding project:', error)
      }
    })
  }, [
    selectedRepository,
    selectedInstallation,
    schemaFileFormat,
    schemaFilePath,
  ])

  const isSaveDisabled = !selectedRepository || schemaFilePath === ''

  return (
    <div className={styles.container}>
      <TokenRefreshKick trigger={needsRefresh} />
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Add New Project</h1>
          <div className={styles.stepperSection}>
            <Stepper steps={steps} activeIndex={selectedRepository ? 1 : 0} />
            {selectedRepository && (
              <div className={styles.buttons}>
                <Button
                  variant="outline-secondary"
                  size="md"
                  isLoading={isPending}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid-primary"
                  size="md"
                  isLoading={isPending}
                  disabled={isSaveDisabled}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </header>
        {selectedRepository ? (
          <SetSchemaForm
            filePath={schemaFilePath}
            format={schemaFileFormat}
            onFilePathChange={setSchemaFilePath}
            onFormatChange={setSchemaFileFormat}
          />
        ) : (
          <InstallationSelector
            installations={installations}
            selectedInstallation={selectedInstallation}
            needsRefresh={needsRefresh}
            onSelectInstallation={setSelectedInstallation}
            onSelectRepository={setSelectedRepository}
          />
        )}
        <Link href={urlgen('projects')} className={styles.backLink}>
          <ArrowLeft aria-hidden className={styles.backIcon} />
          <span>Back to Projects</span>
        </Link>
      </div>
    </div>
  )
}
