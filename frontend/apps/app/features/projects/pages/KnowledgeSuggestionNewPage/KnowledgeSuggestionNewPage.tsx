import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'
import { createKnowledgeSuggestion } from '../../actions/createKnowledgeSuggestion'

type Props = {
  projectId: string
}

async function getProjectWithRepository(projectId: string) {
  try {
    const projectId_num = Number(projectId)

    // Get the project with repository info
    const project = await prisma.project.findUnique({
      where: {
        id: projectId_num,
      },
      include: {
        repositoryMappings: {
          include: {
            repository: true,
          },
        },
      },
    })

    if (!project) {
      notFound()
    }

    return project
  } catch (error) {
    console.error('Error fetching project with repository:', error)
    notFound()
  }
}

export const KnowledgeSuggestionNewPage: FC<Props> = async ({ projectId }) => {
  const project = await getProjectWithRepository(projectId)
  const repository = project.repositoryMappings[0]?.repository

  if (!repository) {
    return (
      <div>
        <p>
          No repository found for this project. Please add a repository first.
        </p>
        <Link href={`/app/projects/${projectId}`}>Back to Project</Link>
      </div>
    )
  }

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
          <h1>Create New Knowledge Suggestion</h1>
        </div>
      </div>

      <div>
        <form action={createKnowledgeSuggestion}>
          <input type="hidden" name="projectId" value={projectId} />
          <input
            type="hidden"
            name="repositoryOwner"
            value={repository.owner}
          />
          <input type="hidden" name="repositoryName" value={repository.name} />
          <input
            type="hidden"
            name="installationId"
            value={repository.installationId.toString()}
          />

          <div>
            <label htmlFor="type">Type:</label>
            <select id="type" name="type" required>
              <option value="SCHEMA">SCHEMA</option>
              <option value="DOCS">DOCS</option>
            </select>
          </div>

          <div>
            <label htmlFor="title">Title (Commit Message):</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="Enter a title for this suggestion"
            />
          </div>

          <div>
            <label htmlFor="path">File Path:</label>
            <input
              type="text"
              id="path"
              name="path"
              required
              placeholder="e.g., docs/schema.md"
            />
          </div>

          <div>
            <label htmlFor="content">Content:</label>
            <textarea
              id="content"
              name="content"
              rows={15}
              required
              placeholder="Enter the file content"
            />
          </div>

          <button type="submit">Create Knowledge Suggestion</button>
        </form>
      </div>
    </div>
  )
}
