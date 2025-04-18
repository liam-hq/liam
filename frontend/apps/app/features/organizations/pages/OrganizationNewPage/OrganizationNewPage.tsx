'use client'

import { urlgen } from '@/utils/routes'
import { Button, Input } from '@liam-hq/ui'
import { useRouter } from 'next/navigation'
import { type FC, type FormEvent, useState } from 'react'
import { createOrganization } from '../../actions/createOrganizations'
import styles from './OrganizationNewPage.module.css'

export const OrganizationNewPage: FC = () => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Computed value instead of state
  const isFormValid = name.trim().length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name) {
      setError('Organization name is required')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createOrganization(name)

    if (result.success) {
      router.push(
        urlgen('organizations/[organizationId]/projects/new', {
          organizationId: result.organizationId,
        }),
      )
    } else {
      setError(
        result.error || 'Failed to create organization. Please try again.',
      )
    }
    setLoading(false)
  }

  // Define button variant based on form state
  const buttonVariant =
    isFormValid && !loading ? 'solid-primary' : 'outline-secondary'

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Create a New Organization</h1>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formContent}>
              <div className={styles.formGroup}>
                <div className={styles.heading}>
                  <label htmlFor="name" className={styles.label}>
                    Organization Name
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Organization name"
                    disabled={loading}
                    aria-label="Organization name"
                  />
                  <span className={styles.helperText}>
                    What's the name of your company or team?
                  </span>
                  {error && <p className={styles.error}>{error}</p>}
                </div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.buttonContainer}>
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                variant={buttonVariant}
                className={styles.buttonCustom}
              >
                Create Organization
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
