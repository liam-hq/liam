import { createClient } from '@/libs/db/server'
import { urlgen } from '@/libs/routes'
import Link from 'next/link'

import type { FC } from 'react'
import { match } from 'ts-pattern'
import { ContentForDoc } from './ContentForDoc'
import { ContentForSchema } from './ContentForSchema'
import styles from './KnowledgeSuggestionDetailPage.module.css'
import { approveKnowledgeSuggestion } from './actions/approveKnowledgeSuggestion'
import { getOriginalDocumentContent } from './services/getOriginalDocumentContent'

async function getSuggestionWithProject(
  suggestionId: string,
  projectId: string,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('knowledge_suggestions')
    .select(`
      *,
      projects(
        id,
        name,
        project_repository_mappings(
          github_repositories(*)
        )
      )
    `)
    .eq('id', suggestionId)
    .eq('project_id', projectId)
    .single()

  if (error) throw error

  return data
}

export type SuggestionWithProject = Awaited<
  ReturnType<typeof getSuggestionWithProject>
>

type Props = {
  projectId: string
  suggestionId: string
  branchOrCommit: string
}

async function getKnowledgeSuggestionDetail(
  projectId: string,
  suggestionId: string,
) {
  // Get the knowledge suggestion with project info
  const suggestion = await getSuggestionWithProject(suggestionId, projectId)

  if (!suggestion) {
    throw new Error('Knowledge suggestion not found')
  }

  return suggestion
}

export const KnowledgeSuggestionDetailPage: FC<Props> = async ({
  projectId,
  suggestionId,
  branchOrCommit,
}) => {
  const suggestion = await getKnowledgeSuggestionDetail(projectId, suggestionId)
  const repository =
    suggestion.projects.project_repository_mappings[0]?.github_repositories

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link
            href={urlgen(
              'projects/[projectId]/ref/[branchOrCommit]/knowledge-suggestions',
              {
                projectId,
                branchOrCommit: suggestion.branch_name,
              },
            )}
            className={styles.backLink}
            aria-label="Back to knowledge suggestions list"
          >
            ← Back to Knowledge Suggestions
          </Link>
          <h1 className={styles.title}>{suggestion.title}</h1>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.metaSection}>
          <span className={styles.metaItem}>Type: {suggestion.type}</span>
          <span className={styles.metaItem}>Path: {suggestion.path}</span>
          <span
            className={
              suggestion.approved_at ? styles.approved : styles.pending
            }
          >
            Status: {suggestion.approved_at ? 'Approved' : 'Pending'}
          </span>
          <span className={styles.metaItem}>
            Created:{' '}
            {new Date(suggestion.created_at).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
              hour12: false,
            })}
          </span>
          {suggestion.approved_at && (
            <span className={styles.metaItem}>
              Approved:{' '}
              {new Date(suggestion.created_at).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                hour12: false,
              })}
            </span>
          )}
        </div>

        {suggestion.reasoning && (
          <div>
            <div className={styles.header}>
              <h2 className={styles.sectionTitle}>Reasoning</h2>
            </div>
            <div>{suggestion.reasoning}</div>
          </div>
        )}

        {match(suggestion.type)
          .with('SCHEMA', () => (
            <ContentForSchema
              suggestion={suggestion}
              projectId={projectId}
              branchOrCommit={branchOrCommit}
            />
          ))
          .with('DOCS', async () => (
            <ContentForDoc
              suggestion={suggestion}
              originalContent={
                !suggestion.approved_at
                  ? await getOriginalDocumentContent(
                      projectId,
                      suggestion.branch_name,
                      suggestion.path,
                    )
                  : null
              }
            />
          ))
          .exhaustive()}

        {!suggestion.approved_at && repository && (
          <div className={styles.actionSection}>
            <form action={approveKnowledgeSuggestion}>
              <input type="hidden" name="suggestionId" value={suggestion.id} />
              <input
                type="hidden"
                name="repositoryOwner"
                value={repository.owner}
              />
              <input
                type="hidden"
                name="repositoryName"
                value={repository.name}
              />
              <input
                type="hidden"
                name="installationId"
                value={repository.github_installation_identifier.toString()}
              />
              <button type="submit" className={styles.approveButton}>
                Approve
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
