import { TextVectorizer } from '@/components/TextVectorizer'
import { UrlVectorizer } from '@/components/UrlVectorizer'
import styles from './page.module.css'

export default function VectorizePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Vectorize Content</h1>
      <UrlVectorizer endpoint="api/vectorize" />
      <TextVectorizer endpoint="api/vectorize" />
    </div>
  )
}
