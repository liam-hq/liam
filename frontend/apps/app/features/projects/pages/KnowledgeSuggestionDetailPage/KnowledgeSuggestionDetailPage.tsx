import { createClient } from '@/libs/db/server'
import { urlgen } from '@/utils/routes'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import { approveKnowledgeSuggestion } from '../../actions/approveKnowledgeSuggestion'
import { getOriginalDocumentContent } from '../../utils/getOriginalDocumentContent'
import { ContentForDoc } from './ContentForDoc'
import { ContentForSchema } from './ContentForSchema'
import styles from './KnowledgeSuggestionDetailPage.module.css'

async function getSuggestionWithProject(
  suggestionId: number,
  projectId: number,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('KnowledgeSuggestion')
    .select(`
      *,
      project:Project(
        id,
        name,
        repositoryMappings:ProjectRepositoryMapping(
          repository:Repository(*)
        )
      )
    `)
    .eq('id', suggestionId)
    .eq('projectId', projectId)
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
  try {
    // Get the knowledge suggestion with project info
    const suggestion = await getSuggestionWithProject(
      Number(suggestionId),
      Number(projectId),
    )

    if (!suggestion) {
      console.error('Error fetching knowledge suggestion')
      notFound()
    }

    return suggestion
  } catch (error) {
    console.error('Error fetching knowledge suggestion detail:', error)
    notFound()
  }
}

export const KnowledgeSuggestionDetailPage: FC<Props> = async ({
  projectId,
  suggestionId,
  branchOrCommit,
}) => {
  const suggestion = await getKnowledgeSuggestionDetail(projectId, suggestionId)
  const repository = suggestion.project.repositoryMappings[0]?.repository

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Link
            href={urlgen(
              'projects/[projectId]/ref/[branchOrCommit]/knowledge-suggestions',
              {
                projectId,
                branchOrCommit: suggestion.branchName,
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
            className={suggestion.approvedAt ? styles.approved : styles.pending}
          >
            Status: {suggestion.approvedAt ? 'Approved' : 'Pending'}
          </span>
          <span className={styles.metaItem}>
            Created:{' '}
            {new Date(suggestion.createdAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
              hour12: false,
            })}
          </span>
          {suggestion.approvedAt && (
            <span className={styles.metaItem}>
              Approved:{' '}
              {new Date(suggestion.createdAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                hour12: false,
              })}
            </span>
          )}
        </div>

        {suggestion.reasoning && (
          <div className={styles.reasoningSection}>
            <div className={styles.header}>
              <h2 className={styles.sectionTitle}>Reasoning</h2>
            </div>
            <div className={styles.reasoningContent}>
              {suggestion.reasoning}
            </div>
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
                !suggestion.approvedAt
                  ? await getOriginalDocumentContent(
                      projectId,
                      suggestion.branchName,
                      suggestion.path,
                    )
                  : null
              }
            />
          ))
          .exhaustive()}

        {!suggestion.approvedAt && repository && (
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
                value={repository.installationId.toString()}
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
