import styles from './DocsDetailPage.module.css'
import { getDocumentContent } from './getDocumentContent'

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
      return null
    }

    return (
      <div className={styles.container}>
        <pre className={styles.content}>{content}</pre>
      </div>
    )
  } catch (error) {
    console.error('Error fetching document:', error)
    return null
  }
}
