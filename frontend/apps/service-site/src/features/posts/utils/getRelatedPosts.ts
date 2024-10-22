import type { Lang } from '@/features/i18n'
import type { Post } from 'contentlayer/generated'
import { allPosts } from './allPosts'

type Params = {
  post: Post
  lang: Lang
}

export function getRelatedPosts({ lang }: Params) {
  return allPosts(lang).slice(0, 4)
}
