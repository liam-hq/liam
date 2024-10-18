import { remarkLinkCard } from '@/libs/remark'
import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: 'posts/*/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    publishedAt: {
      type: 'date',
      required: true,
      description: 'ISO string: "2024-10-16T08:44:14.716Z"',
    },
    tags: {
      type: 'list',
      of: {
        type: 'string',
      },
      required: true,
    },
    categories: {
      type: 'list',
      of: {
        type: 'string',
      },
      required: true,
    },
    image: { type: 'string', required: true },
    writer: { type: 'string', required: true },
    writerProfile: { type: 'string' },
    lastEditedAt: { type: 'date' },
    introduction: { type: 'string', required: true },
  },
  computedFields: {
    lang: {
      type: 'string',
      resolve: (post) => {
        // ex. segments = [ 'posts', '1', 'en' ]
        const segments = post._raw.flattenedPath.split('/')
        return segments[2]
      },
    },
    slug: {
      type: 'string',
      resolve: (post) => {
        // ex. segments = [ 'posts', '1', 'en' ]
        const segments = post._raw.flattenedPath.split('/')
        return segments[1]
      },
    },
  },
}))

export const Privacy = defineDocumentType(() => ({
  name: 'Privacy',
  filePathPattern: 'privacy/*.mdx',
  contentType: 'mdx',
  computedFields: {
    lang: {
      type: 'string',
      resolve: (post) => {
        // ex. segments = [ 'posts', 'en' ]
        const segments = post._raw.flattenedPath.split('/')
        return segments[1]
      },
    },
  },
}))

export default makeSource({
  contentDirPath: 'src/contents',
  documentTypes: [Post, Privacy],
  mdx: {
    remarkPlugins: [remarkGfm, remarkBreaks, remarkLinkCard],
    rehypePlugins: [rehypeSlug, rehypePrettyCode],
  },
})
