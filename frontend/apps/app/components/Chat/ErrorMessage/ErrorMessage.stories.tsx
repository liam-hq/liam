import type { Meta, StoryObj } from '@storybook/react'
import { ErrorMessage } from './ErrorMessage'
import type { ChatEntry } from '../types/chatTypes'

const meta = {
  title: 'Components/Chat/ErrorMessage',
  component: ErrorMessage,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

const mockErrorMessage: ChatEntry = {
  id: 'error-1',
  dbId: 'error-1',
  role: 'error',
  content: 'ネットワークエラーが発生しました。接続を確認して再試行してください。',
  timestamp: new Date(),
  isGenerating: false,
}

export const Default: Story = {
  args: {
    message: mockErrorMessage,
  } as any,
}

export const WithRetryButton: Story = {
  args: {
    message: mockErrorMessage,
    onRetry: () => console.log('Retry clicked'),
  } as any,
}

export const LongErrorMessage: Story = {
  args: {
    message: {
      ...mockErrorMessage,
      content: 'サーバーからの応答に時間がかかっています。データベースの接続に問題があるか、リクエストが複雑すぎる可能性があります。しばらく時間を置いて再試行するか、管理者にお問い合わせください。',
    },
  } as any,
}

export const APIErrorMessage: Story = {
  args: {
    message: {
      ...mockErrorMessage,
      content: 'APIエラーが発生しました: 認証に失敗しました。ログインし直してください。',
    },
  } as any,
}

export const WithoutTimestamp: Story = {
  args: {
    message: {
      ...mockErrorMessage,
      timestamp: undefined,
    },
  } as any,
}