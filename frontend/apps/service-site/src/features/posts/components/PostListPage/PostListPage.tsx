import { type Lang, fallbackLang, getTranslation } from '@/features/i18n'
import { PostCard } from '@/features/posts'
import type { Post } from 'contentlayer/generated'
import type { FC } from 'react'
import styles from './PostListPage.module.css'

type Props = {
  lang?: Lang
  posts: Post[]
}

export const PostListPage: FC<Props> = ({ lang, posts }) => {
  const { t } = getTranslation(lang ?? fallbackLang)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('posts.title')}</h1>
      </div>
      <div className={styles.postCardList}>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
