import type { Lang } from '@/features/i18n'
import type { Post } from 'contentlayer/generated'
import Image from 'next/image'
import Link from 'next/link'
import type { FC } from 'react'
import { createPostDetailLink } from '../../utils'
import styles from './PostCard.module.css'

type Props = {
  post: Post
  lang?: Lang
}

export const PostCard: FC<Props> = ({ post, lang }) => {
  return (
    <div className={styles.postCard}>
      <Link href={createPostDetailLink({ lang, slug: post.slug })}>
        <div className={styles.inner}>
          <Image
            src={post.image}
            alt={`Image of ${post.title}`}
            width={328}
            height={246}
            sizes="100vw"
            style={{
              width: '100%',
              height: 'auto',
            }}
          />
          <div className={styles.footer}>
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.writer}>Text by {post.writer}</p>
          </div>
        </div>
      </Link>
    </div>
  )
}
