import type { Meta } from '@storybook/react'
import { UploadSessionFormPresenter } from './UploadSessionFormPresenter'

const meta = {
  title: 'Features/Sessions/UploadSessionFormPresenter',
  component: UploadSessionFormPresenter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UploadSessionFormPresenter>

export default meta

export const Default = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <UploadSessionFormPresenter isPending={false} formAction={() => {}} />
      </div>
    )
  },
}

export const WithFormError = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <UploadSessionFormPresenter
          formError="Please enter a valid message."
          isPending={false}
          formAction={() => {}}
        />
      </div>
    )
  },
}

export const Pending = {
  render: () => {
    return (
      <div style={{ width: '800px' }}>
        <UploadSessionFormPresenter isPending={true} formAction={() => {}} />
      </div>
    )
  },
}
