'use client'

import { urlgen } from '@/libs/routes'
import { Button, Input, useToast } from '@liam-hq/ui'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useActionState } from 'react'
import styles from '../../GeneralPage.module.css'
import {
  deleteOrganizationAction,
  updateOrganizationAction,
} from './actions/organizationClientActions'
import { DeleteOrganizationButtonClient } from './components/DeleteOrganizationButtonClient'

export function GeneralPageClient({
  organization,
}: {
  organization: { id: string; name: string }
}) {
  const toast = useToast()
  const router = useRouter()

  // Use useActionState for update action
  const [updateState, updateAction] = useActionState(updateOrganizationAction, {
    success: false,
    error: null,
    message: null,
  })

  // Use useActionState for delete action
  const [deleteState, deleteAction] = useActionState(deleteOrganizationAction, {
    success: false,
    error: null,
    message: null,
  })

  // Show toast notifications based on action states
  useEffect(() => {
    if (updateState.success) {
      toast({
        title: 'Updated',
        description: updateState.message,
        status: 'success',
      })
    } else if (updateState.error) {
      toast({
        title: 'Error',
        description: updateState.error,
        status: 'error',
      })
    }
  }, [updateState, toast])

  useEffect(() => {
    if (deleteState.success) {
      // Store success message in sessionStorage before redirect
      sessionStorage.setItem(
        'organization_deleted',
        JSON.stringify({
          title: 'Deleted',
          description: deleteState.message,
          status: 'success',
        }),
      )

      // Use Next.js router with urlgen for consistent navigation
      router.push(urlgen('organizations'))
    } else if (deleteState.error) {
      toast({
        title: 'Error',
        description: deleteState.error,
        status: 'error',
      })
    }
  }, [deleteState, toast, router])

  return (
    <div className={styles.container}>
      {/* Organization Name Section */}
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <div className={styles.rowContainer}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Organization Name</h3>
            </div>
            <div className={styles.inputContainer}>
              <Input
                name="name"
                form="updateOrgForm"
                defaultValue={organization.name}
                className={styles.input}
              />
              <p className={styles.helperText}>
                This is your team's visible name within Liam Migration. For
                example, the name of your company or team.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.cardFooter}>
          <form id="updateOrgForm" action={updateAction}>
            <input
              type="hidden"
              name="organizationId"
              value={organization.id}
            />
            <Button variant="solid-primary" type="submit">
              Save
            </Button>
          </form>
        </div>
      </div>

      {/* Delete Organization Section */}
      <div className={styles.dangerCard}>
        <div className={styles.cardContent}>
          <div className={styles.rowContainer}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Delete Organization</h3>
            </div>
            <div className={styles.inputContainer}>
              <p className={styles.dangerText}>
                Permanently remove your organization and all of its contents
                from the Liam Migration.
                <br />
                This action is not reversible — please continue with caution.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.dangerDivider} />
        <div className={styles.cardFooter}>
          <DeleteOrganizationButtonClient
            organizationId={organization.id}
            organizationName={organization.name}
            deleteAction={deleteAction}
          />
        </div>
      </div>
    </div>
  )
}
