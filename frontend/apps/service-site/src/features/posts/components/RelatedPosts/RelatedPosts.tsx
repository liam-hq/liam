import type { Lang } from '@/features/i18n'
import type { Post } from 'contentlayer/generated'
import Image from 'next/image'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import { createPostDetailLink } from '../../utils'
import styles from './RelatedPosts.module.css'

type Props = PropsWithChildren<{
  posts: Post[]
  lang?: Lang | undefined
}>

export const RelatedPosts = ({ posts, lang }: Props) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Related Posts</h2>
      <ul className={styles.postsWrapper}>
        {posts.map((post) => (
          <li className={styles.post} key={post._id}>
            <Link href={createPostDetailLink({ lang, slug: post.slug })}>
              <Image
                src={post.image}
                alt={`Image of ${post.title}`}
                width={100}
                height={200}
                className={styles.image}
                quality={100}
              />
            </Link>

            <h3 className={styles.postTitle}>
              <Link href={createPostDetailLink({ lang, slug: post.slug })}>
                {post.title}
              </Link>
            </h3>
            <div className={styles.writer}>Text by {post.writer}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
