import type { Meta, StoryObj } from '@storybook/react'

import { aPost } from '@/features/posts/factories'
import type { ComponentProps } from 'react'
import { RelatedPosts } from './RelatedPosts'

type Props = ComponentProps<typeof RelatedPosts>
const StoryComponent = (props: Props) => {
  return <RelatedPosts {...props} />
}

export default {
  component: StoryComponent,
} satisfies Meta<typeof StoryComponent>

export const Default: StoryObj<typeof StoryComponent> = {
  args: {
    posts: Array.from({ length: 14 }, (_, i) => ({
      ...aPost({
        _id: `${i + 1}`,
        title: `${i + 1} The No-Code Revolution: A New Era Where Non-Programmers Can Build Apps`,
      }),
    })),
  },
}
