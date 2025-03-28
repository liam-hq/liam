import { urlgen } from '@/utils/routes'
import Link from 'next/link'
import { getGitHubDocFilePaths } from './getGitHubDocFilePaths'

interface DocsListPageProps {
  projectId: string
  branchOrCommit: string
}

export const DocsListPage = async ({
  projectId,
  branchOrCommit,
}: DocsListPageProps) => {
  const docFilePaths = await getGitHubDocFilePaths(projectId)

  if (!docFilePaths || docFilePaths.length === 0) {
    return (
      <div>
        <h1>Documentation Files</h1>
        <p>No documentation files found for this project.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Documentation Files</h1>
      <ul>
        {docFilePaths.map((docFilePath) => (
          <li key={docFilePath.id}>
            <Link
              href={urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/docs/[docFilePath]',
                {
                  projectId,
                  branchOrCommit,
                  docFilePath: docFilePath.path,
                },
              )}
            >
              {docFilePath.path}
            </Link>
            {!docFilePath.isReviewEnabled && <span> (Review disabled)</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
