import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { approveKnowledgeSuggestion } from '../../actions/approveKnowledgeSuggestion'

type Props = {
  projectId: string
  suggestionId: string
}

async function getKnowledgeSuggestionDetail(
  projectId: string,
  suggestionId: string,
) {
  try {
    const projectId_num = Number(projectId)
    const suggestionId_num = Number(suggestionId)

    // Get the knowledge suggestion with project info
    const suggestion = await prisma.knowledgeSuggestion.findFirst({
      where: {
        id: suggestionId_num,
        projectId: projectId_num,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            repositoryMappings: {
              include: {
                repository: true,
              },
            },
          },
        },
      },
    })

    if (!suggestion) {
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
}) => {
  const suggestion = await getKnowledgeSuggestionDetail(projectId, suggestionId)
  const repository = suggestion.project.repositoryMappings[0]?.repository

  return (
    <div>
      <div>
        <div>
          <Link
            href={`/app/projects/${projectId}/knowledge-suggestions`}
            aria-label="Back to knowledge suggestions list"
          >
            ← Back to Knowledge Suggestions
          </Link>
          <h1>{suggestion.title}</h1>
        </div>
      </div>

      <div>
        <div>
          <span>Type: {suggestion.type}</span>
          <span>Path: {suggestion.path}</span>
          <span>Status: {suggestion.approvedAt ? 'Approved' : 'Pending'}</span>
          <span>
            Created: {suggestion.createdAt.toLocaleDateString('en-US')}
          </span>
          {suggestion.approvedAt && (
            <span>
              Approved: {suggestion.approvedAt.toLocaleDateString('en-US')}
            </span>
          )}
        </div>

        <div>
          <h2>Content</h2>
          <pre>{suggestion.content}</pre>
        </div>

        {!suggestion.approvedAt && repository && (
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
            <button type="submit">Approve</button>
          </form>
        )}
      </div>
    </div>
  )
}
