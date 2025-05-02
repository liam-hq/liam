'use client'

import { Button, ErdIcon } from '@liam-hq/ui'
import { type FC, useState } from 'react'
import styles from './FileChanges.module.css'

// 変更タイプの定義
type ChangeType = 'added' | 'modified' | 'deleted'

// ファイル変更の型定義
type FileChange = {
  path: string
  type: ChangeType
  id: string // 一意のIDを追加
  // ネストされたファイル構造のためのプロパティ
  isDirectory?: boolean
  children?: FileChange[]
}

export const FileChanges: FC = () => {
  // モックデータ（実際の実装ではAPIから取得）
  const [fileChanges] = useState<FileChange[]>(mockFileChanges)
  const [commitMessage, setCommitMessage] = useState('')

  // コミット処理（モック）
  const handleCommit = () => {
    // 実際の実装ではAPIを呼び出す
    setCommitMessage('')
  }

  // ERDベースのdiffチェック（モック）
  const handleErdDiffCheck = () => {
    // TODO: ERDベースのdiffチェック機能の実装
    // 将来的にここにERDベースのdiffチェック機能を実装
  }

  return (
    <div className={styles.container}>
      {/* コミットフォーム */}
      <div className={styles.commitForm}>
        <input
          type="text"
          className={styles.commitMessage}
          placeholder="Enter commit message"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
        />
        <button
          type="button"
          className={styles.pushButton}
          onClick={handleCommit}
          disabled={!commitMessage.trim()}
        >
          Commit
        </button>
      </div>

      {/* ERDベースのdiffチェックボタン */}
      <div className={styles.erdDiffButtonContainer}>
        <Button
          variant="outline-secondary"
          size="sm"
          leftIcon={<ErdIcon size={16} />}
          onClick={handleErdDiffCheck}
          className={styles.erdDiffButton}
        >
          Check diff based on ERD
        </Button>
      </div>

      {/* ファイル変更リスト */}
      <div className={styles.fileList}>
        <FileChangesList changes={fileChanges} />
      </div>
    </div>
  )
}

// ファイル変更リストコンポーネント
const FileChangesList: FC<{ changes: FileChange[] }> = ({ changes }) => {
  return (
    <div className={styles.changesList}>
      {changes.map((change) => (
        <FileChangeItem key={change.id} change={change} />
      ))}
    </div>
  )
}

// 個別のファイル変更アイテム
const FileChangeItem: FC<{ change: FileChange }> = ({ change }) => {
  const [expanded, setExpanded] = useState(true)

  // 変更タイプに応じたスタイルクラスを取得
  const getStatusClass = (type: ChangeType) => {
    switch (type) {
      case 'added':
        return styles.statusAdded
      case 'modified':
        return styles.statusModified
      case 'deleted':
        return styles.statusDeleted
      default:
        return ''
    }
  }

  const handleToggle = () => {
    if (change.isDirectory) {
      setExpanded(!expanded)
    }
  }

  return (
    <div className={styles.changeItem}>
      <button
        type="button"
        className={styles.changeHeader}
        onClick={handleToggle}
        aria-expanded={change.isDirectory ? expanded : undefined}
      >
        <div className={styles.fileInfo}>
          {change.isDirectory && (
            <span
              className={
                expanded ? styles.folderExpanded : styles.folderCollapsed
              }
            >
              {expanded ? '▼' : '▶'}
            </span>
          )}
          <span className={styles.filePath}>{change.path}</span>
        </div>
        <span
          className={`${styles.statusIndicator} ${getStatusClass(change.type)}`}
        />
      </button>

      {change.isDirectory && expanded && change.children && (
        <div className={styles.nestedChanges}>
          <FileChangesList changes={change.children} />
        </div>
      )}
    </div>
  )
}

// モックデータ - 一意のIDを追加
const mockFileChanges: FileChange[] = [
  {
    id: '.liam',
    path: '.liam',
    type: 'added',
    isDirectory: true,
    children: [
      {
        id: '.liam/schema-override.yml',
        path: 'schema-override.yml',
        type: 'added',
      },
    ],
  },
  {
    id: 'frontend',
    path: 'frontend',
    type: 'modified',
    isDirectory: true,
    children: [
      {
        id: 'frontend/packages/db',
        path: 'packages/db',
        type: 'modified',
        isDirectory: true,
        children: [
          {
            id: 'frontend/packages/db/schema',
            path: 'schema',
            type: 'modified',
            isDirectory: true,
            children: [
              {
                id: 'frontend/packages/db/schema/schema.sql',
                path: 'schema.sql',
                type: 'modified',
              },
            ],
          },
        ],
      },
    ],
  },
]
