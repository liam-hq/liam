import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'

type Props = {
  projectId: string
}

async function getProjectDocs(projectId: string) {
  try {
    const projectId_num = Number(projectId)

    // Get the project with docs
    const project = await prisma.project.findUnique({
      where: {
        id: projectId_num,
      },
      include: {
        docs: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      notFound()
    }

    return project
  } catch (error) {
    console.error('Error fetching project docs:', error)
    notFound()
  }
}

export const DocsListPage: FC<Props> = async ({ projectId }) => {
  const project = await getProjectDocs(projectId)

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
          <h1>{project.name} - Documentation</h1>
        </div>
      </div>

      <div>
        {project.docs.length === 0 ? (
          <div>
            <p>No documentation found for this project.</p>
          </div>
        ) : (
          <ul>
            {project.docs.map((doc) => (
              <li key={doc.id}>
                <Link href={`/app/projects/${projectId}/docs/${doc.id}`}>
                  <div>{doc.title}</div>
                  <div>
                    <span>
                      Created: {doc.createdAt.toLocaleDateString('en-US')}
                    </span>
                    <span>
                      Updated: {doc.updatedAt.toLocaleDateString('en-US')}
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
