import { KnowledgeRetrievalWindow } from '@/components/KnowledgeRetrievalWindow'
import styles from './page.module.css'

export default function KnowledgeRetrievalPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Database Knowledge Retrieval</h1>
      <KnowledgeRetrievalWindow
        endpoint="api/retrieve"
        placeholder="Describe the database schema change you're planning to make..."
      />
    </div>
  )
}
