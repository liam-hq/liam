import styles from './DocsDetailPage.module.css'
import { getDocumentContent } from './services/getDocumentContent'

interface DocsDetailPageProps {
  projectId: string
  branchOrCommit: string
  docFilePath: string[]
}

export const DocsDetailPage = async ({
  projectId,
  branchOrCommit,
  docFilePath,
}: DocsDetailPageProps) => {
  try {
    const content = await getDocumentContent({
      projectId,
      branchOrCommit,
      docFilePath,
    })

    if (!content) {
      throw new Error('Document content not found')
    }

    return (
      <div className={styles.container}>
        <pre className={styles.content}>{content}</pre>
      </div>
    )
  } catch (error) {
    console.error('Error fetching document:', error)
    throw new Error('Failed to fetch document')
  }
}
