import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import Link from 'next/link'
import type { FC } from 'react'
import styles from './MigrationsListPage.module.css'

type Props = {
  projectId: string
  branchOrCommit: string
}

async function getMigrationsList(projectId: string) {
  const supabase = await createClient()

  const { data: migrations, error: migrationsError } = await supabase
    .from('migrations')
    .select(`
      id,
      title,
      created_at,
      migration_pull_request_mappings (
        github_pull_requests (
          pull_number
        )
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (migrationsError) {
    console.error('Error fetching migrations:', migrationsError)
    return { migrations: [] }
  }

  const migrationsWithData = migrations.map((migration) => ({
    id: migration.id,
    title: migration.title,
    pullNumber:
      migration.migration_pull_request_mappings[0]?.github_pull_requests
        ?.pull_number,
    createdAt: migration.created_at,
  }))

  return { migrations: migrationsWithData }
}

export const MigrationsListPage: FC<Props> = async ({
  projectId,
  branchOrCommit,
}) => {
  const { migrations } = await getMigrationsList(projectId)

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Migrations for {branchOrCommit}</h1>
      </div>

      {migrations.length > 0 ? (
        <div className={styles.migrationsList}>
          {migrations.map((migration) => (
            <Link
              key={migration.id}
              href={urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/migrations/[migrationId]',
                {
                  projectId,
                  branchOrCommit,
                  migrationId: migration.id,
                },
              )}
              className={styles.migrationItem}
            >
              <div className={styles.migrationTitle}>{migration.title}</div>
              <div className={styles.migrationMeta}>
                <span>PR #{migration.pullNumber}</span>
                <span>
                  {new Date(migration.createdAt).toLocaleDateString('en-US')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No migrations found for this branch.</p>
        </div>
      )}
    </main>
  )
}
