import { ChevronRight } from '@liam-hq/ui'
import type { Meta, StoryObj } from '@storybook/nextjs'
import styles from './AppBar.module.css'
import { AppBarView } from './AppBarView'

const meta = {
  component: AppBarView,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    avatarUrl: null,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
  },
} satisfies Meta<typeof AppBarView>

export default meta
type Story = StoryObj<typeof AppBarView>

export const Default: Story = {}

export const WithAvatar: Story = {
  args: {
    avatarUrl: 'https://via.placeholder.com/40',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
  },
}

export const WithBreadcrumbs: Story = {
  args: {
    breadcrumbsContent: (
      <div className={styles.breadcrumbs}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Sample Project</span>
          <ChevronRight className={styles.chevronRight} />
          <span>main</span>
        </div>
      </div>
    ),
  },
}

export const WithFullBreadcrumbsAndAvatar: Story = {
  args: {
    avatarUrl: 'https://via.placeholder.com/40',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
    breadcrumbsContent: (
      <div className={styles.breadcrumbs}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>My Long Project Name</span>
          <ChevronRight className={styles.chevronRight} />
          <span>feature/my-branch</span>
        </div>
      </div>
    ),
  },
}

export const WithoutUserInfo: Story = {
  args: {
    avatarUrl: null,
    userName: undefined,
    userEmail: null,
  },
}
