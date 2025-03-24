import { prisma } from '@liam-hq/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { FC } from 'react'

type Props = {
  projectId: string
  docId: string
}

async function getDocDetail(projectId: string, docId: string) {
  try {
    const projectId_num = Number(projectId)
    const docId_num = Number(docId)

    // Get the doc with project info
    const doc = await prisma.doc.findFirst({
      where: {
        id: docId_num,
        projectId: projectId_num,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!doc) {
      notFound()
    }

    return doc
  } catch (error) {
    console.error('Error fetching doc detail:', error)
    notFound()
  }
}

export const DocDetailPage: FC<Props> = async ({ projectId, docId }) => {
  const doc = await getDocDetail(projectId, docId)

  return (
    <div>
      <div>
        <div>
          <Link
            href={`/app/projects/${projectId}/docs`}
            aria-label="Back to docs list"
          >
            ← Back to Docs
          </Link>
          <h1>{doc.title}</h1>
        </div>
      </div>

      <div>
        <div>
          <span>Created: {doc.createdAt.toLocaleDateString('en-US')}</span>
          <span>Updated: {doc.updatedAt.toLocaleDateString('en-US')}</span>
        </div>

        <div>
          {/* For now, just display the raw content */}
          <pre>{doc.content}</pre>
        </div>
      </div>
    </div>
  )
}
