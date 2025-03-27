import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'

type Props = {
  projectId: string
}

async function getKnowledgeSuggestions(projectId: string) {
  try {
    const projectId_num = Number(projectId)

    // Directly query knowledge suggestions by projectId
    const knowledgeSuggestions = await prisma.knowledgeSuggestion.findMany({
      where: {
        projectId: projectId_num,
      },
      select: {
        id: true,
        type: true,
        title: true,
        path: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return knowledgeSuggestions
  } catch (error) {
    console.error('Error fetching knowledge suggestions:', error)
    notFound()
  }
}

export const KnowledgeSuggestionsListPage: FC<Props> = async ({
  projectId,
}) => {
  const knowledgeSuggestions = await getKnowledgeSuggestions(projectId)

  return (
    <div>
      <div>
        <div>
          <Link
            href={`/app/projects/${projectId}`}
            aria-label="Back to project details"
          >
            ← Back to Project
          </Link>
          <h1>Knowledge Suggestions</h1>
        </div>
      </div>

      <div>
        {knowledgeSuggestions.length === 0 ? (
          <div>
            <p>No knowledge suggestions found for this project.</p>
          </div>
        ) : (
          <ul>
            {knowledgeSuggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <Link
                  href={`/app/projects/${projectId}/knowledge-suggestions/${suggestion.id}`}
                >
                  <div>{suggestion.title}</div>
                  <div>
                    <span>Type: {suggestion.type}</span>
                    <span>Path: {suggestion.path}</span>
                    <span>
                      Status: {suggestion.approvedAt ? 'Approved' : 'Pending'}
                    </span>
                    <span>
                      Created:{' '}
                      {suggestion.createdAt.toLocaleDateString('en-US')}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
