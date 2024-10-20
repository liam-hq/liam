import type { Meta, StoryObj } from '@storybook/react'

import type { ComponentProps } from 'react'
import { MoreLink } from './MoreLink'

type Props = ComponentProps<typeof MoreLink>
const StoryComponent = (props: Props) => {
  return <MoreLink {...props} />
}

export default {
  component: StoryComponent,
} satisfies Meta<typeof StoryComponent>

export const Default: StoryObj<typeof StoryComponent> = {
  args: {
    href: '/posts',
  },
}
