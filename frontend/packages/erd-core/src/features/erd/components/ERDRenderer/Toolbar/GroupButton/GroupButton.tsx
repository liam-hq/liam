import { IconButton } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow } from '@xyflow/react'
import { type FC, useCallback } from 'react'

interface GroupButtonProps {
  projectId?: string
  branchOrCommit?: string
}

export const GroupButton: FC<GroupButtonProps> = ({
  projectId,
  branchOrCommit,
}) => {
  const { getNodes } = useReactFlow()

  // 選択されたテーブルノードのみを取得
  const selectedNodes = getNodes().filter(
    (node) => node.selected && node.type === 'table',
  )
  const isDisabled = selectedNodes.length < 2

  const handleCreateGroup = useCallback(async () => {
    if (isDisabled || !projectId || !branchOrCommit) return

    // プロンプトでグループ名を入力
    const groupName = window.prompt('グループ名を入力してください')
    if (!groupName || !groupName.trim()) return

    try {
      // APIエンドポイントを呼び出してグループを作成
      const response = await fetch('/api/schema/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          tables: selectedNodes.map((node) => node.id),
          projectId,
          branchOrCommit,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create group')
      }

      // ページをリロードして変更を反映
      window.location.reload()
    } catch (error) {
      console.error('Error creating group:', error)
      alert('グループの作成に失敗しました')
    }
  }, [selectedNodes, isDisabled, projectId, branchOrCommit])

  return (
    <ToolbarButton asChild onClick={handleCreateGroup} disabled={isDisabled}>
      <IconButton
        size="md"
        icon={<GroupIcon />}
        tooltipContent={
          isDisabled
            ? '2つ以上のテーブルを選択してください'
            : 'テーブルをグループ化'
        }
        aria-label="テーブルをグループ化"
      />
    </ToolbarButton>
  )
}

// グループアイコンコンポーネント
const GroupIcon = () => (
  <svg
    role="img"
    aria-label="グループ"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="16"
    height="16"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)
