import { TopCards } from '@/components'
import type { Lang } from '@/features/i18n'
import type { Post } from 'contentlayer/generated'
import type { FC } from 'react'
import { MoreLink } from '../MoreLink'
import styles from './TopPage.module.css'

type Props = {
  lang?: Lang
  posts: Post[]
}

export const TopPage: FC<Props> = ({ lang, posts }) => {
  return (
    <>
      <TopCards lang={lang} posts={posts.slice(0, 14)} />
      <div className={styles.footer}>
        <MoreLink href="/posts" />
      </div>
    </>
  )
}
