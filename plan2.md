# コミット履歴ドロップダウンメニュー実装計画

## 1. 機能要件

### 1.1 概要
AppBar.tsxに第3のドロップダウンメニュー「コミット履歴ドロップダウンメニュー」を追加し、ユーザーがブランチの現在・過去・未来のコミットを簡単に行き来できるようにする機能を実装します。

### 1.2 URL構造とルーティング

#### 既存のルーティング
- `projects/[projectId]/ref/[branchOrCommit]`
  - 例: `/app/projects/123/ref/main`
  - ブランチ名またはコミットハッシュを指定して、そのスナップショットを表示

#### 新規ルーティング
- `projects/[projectId]/ref/[branch]/commit/[commit]`
  - 例: `/app/projects/123/ref/main/commit/abcd1234`
  - 特定のブランチの特定のコミットを明示的に指定
  - このルーティングでは、過去・未来のコミットを含むコンテキストを提供

### 1.3 コミット履歴ドロップダウンメニューの仕様

#### 1.3.1 基本デザイン
- 既存の ProjectsDropdownMenu と BranchDropdownMenu のデザインを踏襲
- AppBar 内で BranchDropdownMenu の右側に配置

#### 1.3.2 既存ルーティング（`[branchOrCommit]`）での表示
- **デフォルト表示**: `latest (deadb55f)` 形式
  - `latest` は最新コミットを示す固定テキスト
  - `deadb55f` は最新コミットハッシュの先頭8文字
- **ドロップダウン内容**:
  - 該当ブランチの過去コミット履歴を降順（最新順）で表示
  - 各コミットはハッシュの先頭8文字とコミットメッセージの一部を表示
  - 最大10件まで表示
- **選択時の挙動**:
  - コミットを選択すると、新規ルーティング（`[branch]/commit/[commit]`）に遷移
  - 例: `/app/projects/123/ref/main/commit/deadb55f`

#### 1.3.3 新規ルーティング（`[branch]/commit/[commit]`）での表示
- **デフォルト表示**: 現在表示中のコミットハッシュの先頭8文字
- **ドロップダウン内容**:
  - 未来のコミット（現在より新しいコミット）を上部に表示
  - 現在のコミット
  - 過去のコミット（現在より古いコミット）を下部に表示
  - 全体として時系列降順（最新順）
  - 最大10件まで表示
- **選択時の挙動**:
  - 「latest」を選択した場合: ブランチのデフォルトページに遷移
    - 例: `/app/projects/123/ref/main`
  - 他のコミットを選択した場合: 該当コミットのページに遷移
    - 例: `/app/projects/123/ref/main/commit/abcd1234`

### 1.4 データ取得

- GitHub API（Octokit）を使用してコミット履歴を取得
- 必要に応じて `@liam-hq/github` パッケージの機能を拡張
- コミット情報には以下を含める:
  - コミットハッシュ（SHA）
  - コミット日時
  - コミットメッセージ
  - 作者情報

## 2. 実装方針

### 2.1 新規ルーティングの追加

現在のルーティング:
- `frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branchOrCommit]/page.tsx`

追加する新規ルーティング:
- `frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branch]/commit/[commit]/page.tsx`

### 2.2 ルート定義の更新

`frontend/apps/app/utils/routes/routeDefinitions.ts` に新しいルート定義を追加します:

```typescript
'projects/[projectId]/ref/[branch]/commit/[commit]': (params: {
  projectId: string
  branch: string
  commit: string
}) => {
  const encodedBranch = encodeURIComponent(branch)
  return `/app/projects/${projectId}/ref/${encodedBranch}/commit/${commit}`
}
```

### 2.3 コミット履歴ドロップダウンメニューの実装

新しいコンポーネント構成:
- `CommitDropdownMenu/` ディレクトリを作成
  - `CommitDropdownMenu.tsx`: メインコンポーネント
  - `CommitDropdownMenu.module.css`: スタイル
  - `Content.tsx`: ドロップダウンの内容
  - `services/getCommits.ts`: コミット履歴取得サービス

### 2.4 GitHub API 連携

`@liam-hq/github` パッケージの機能を活用します:
- `getLastCommit`: 最新のコミット情報取得
- 複数コミット取得のための新しい関数の実装（現在は単一コミットのみ取得可能）

### 2.5 詳細実装計画

#### 2.5.1 新規ルーティングページの実装

```typescript
// projects/[projectId]/ref/[branch]/commit/[commit]/page.tsx
import type { PageProps } from '@/app/types'
import { BranchDetailPage } from '@/features/projects/pages/BranchDetailPage/BranchDetailPage'
import * as v from 'valibot'

const paramsSchema = v.object({
  projectId: v.string(),
  branch: v.string(),
  commit: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const { projectId, branch, commit } = parsedParams.output
  // BranchDetailPageは既存のコンポーネントを再利用
  // branchOrCommitパラメータにはcommitを渡す
  return (
    <BranchDetailPage projectId={projectId} branchOrCommit={commit} />
  )
}
```

#### 2.5.2 コミット取得サービスの実装

```typescript
// CommitDropdownMenu/services/getCommits.ts
import { getLastCommit } from '@liam-hq/github'
import { createClient } from '@/libs/db/server'

export type Commit = {
  sha: string
  shortSha: string // 先頭8文字
  date: string
  message: string
  author: string
}

export async function getCommits(
  projectId: string,
  branch: string,
  currentCommit?: string
): Promise<Commit[]> {
  const supabase = await createClient()
  
  // プロジェクトとリポジトリ情報の取得
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_repository_mappings!inner (
        github_repositories (
          id,
          name,
          owner,
          github_installation_identifier
        )
      )
    `)
    .eq('id', projectId)
    .single()

  if (error || !project) {
    console.error('Error fetching project:', error)
    throw new Error('Project not found')
  }

  const repository = project.project_repository_mappings[0].github_repositories
  
  // 最新コミットの取得
  const latestCommit = await getLastCommit(
    Number(repository.github_installation_identifier),
    repository.owner,
    repository.name,
    branch
  )
  
  if (!latestCommit) {
    return []
  }
  
  // 現時点では最新コミットのみ返す
  // 実際の実装では、Octokit APIを使用して複数コミットを取得する必要がある
  const commits: Commit[] = [
    {
      sha: latestCommit.sha,
      shortSha: latestCommit.sha.substring(0, 8),
      date: latestCommit.date,
      message: latestCommit.message,
      author: latestCommit.author
    }
  ]
  
  return commits
}
```

#### 2.5.3 CommitDropdownMenu コンポーネントの実装

```typescript
// CommitDropdownMenu.tsx
import { DropdownMenuRoot, DropdownMenuTrigger } from '@/components'
import { ChevronsUpDown } from '@/icons'
import type { FC } from 'react'
import styles from './CommitDropdownMenu.module.css'
import { Content } from './Content'
import { type Commit, getCommits } from './services/getCommits'

type Props = {
  currentProjectId: string
  currentBranchOrCommit: string
  currentBranch?: string // 特定のブランチを表示する場合（ルーティングbの場合）
}

export const CommitDropdownMenu: FC<Props> = async ({
  currentProjectId,
  currentBranchOrCommit,
  currentBranch,
}) => {
  // ルーティングaの場合はcurrentBranchOrCommitがブランチ名
  // ルーティングbの場合はcurrentBranchが指定されている
  const branch = currentBranch || currentBranchOrCommit
  
  // コミット一覧の取得
  const commits = await getCommits(currentProjectId, branch, currentBranchOrCommit)
  
  // コミットが取得できない場合は表示しない
  if (commits.length === 0) {
    return null
  }
  
  // 現在のコミットを特定
  // ルーティングaの場合は最新コミット
  // ルーティングbの場合は指定されたコミット
  const isLatest = !currentBranch
  const currentCommit = isLatest 
    ? commits[0] 
    : commits.find(commit => commit.sha.startsWith(currentBranchOrCommit)) || commits[0]

  return (
    <DropdownMenuRoot>
      <Trigger currentCommit={currentCommit} isLatest={isLatest} />
      <Content
        currentCommit={currentCommit}
        commits={commits}
        currentProjectId={currentProjectId}
        currentBranch={branch}
        isLatest={isLatest}
      />
    </DropdownMenuRoot>
  )
}

type TriggerProps = {
  currentCommit: Commit
  isLatest: boolean
}

const Trigger: FC<TriggerProps> = ({ currentCommit, isLatest }) => {
  return (
    <DropdownMenuTrigger className={styles.trigger}>
      <div className={styles.nameAndTag}>
        <span className={styles.name}>
          {isLatest ? `latest (${currentCommit.shortSha})` : currentCommit.shortSha}
        </span>
      </div>
      <ChevronsUpDown className={styles.chevronIcon} />
    </DropdownMenuTrigger>
  )
}
```

#### 2.5.4 Content コンポーネントの実装

```typescript
// Content.tsx
'use client'

import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components'
import { urlgen } from '@/utils/routes'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import styles from './CommitDropdownMenu.module.css'
import type { Commit } from './services/getCommits'

type ContentProps = {
  currentCommit: Commit
  commits: Commit[]
  currentProjectId: string
  currentBranch: string
  isLatest: boolean
}

export const Content: FC<ContentProps> = ({
  currentCommit,
  commits,
  currentProjectId,
  currentBranch,
  isLatest,
}) => {
  const router = useRouter()

  const handleChangeCommit = useCallback(
    (commitSha: string) => {
      // 最新コミットの場合はブランチページに遷移
      if (commitSha === 'latest') {
        router.push(
          urlgen('projects/[projectId]/ref/[branchOrCommit]', {
            projectId: currentProjectId,
            branchOrCommit: currentBranch,
          }),
        )
        return
      }
      
      // それ以外の場合は特定コミットページに遷移
      router.push(
        urlgen('projects/[projectId]/ref/[branch]/commit/[commit]', {
          projectId: currentProjectId,
          branch: currentBranch,
          commit: commitSha,
        }),
      )
    },
    [currentProjectId, currentBranch, router],
  )

  return (
    <DropdownMenuPortal>
      <DropdownMenuContent align="start" className={styles.content}>
        <DropdownMenuRadioGroup
          value={isLatest ? 'latest' : currentCommit.sha}
          onValueChange={handleChangeCommit}
        >
          {/* 最新コミットオプション */}
          <DropdownMenuRadioItem
            key="latest"
            value="latest"
            label={`latest (${commits[0].shortSha})`}
            className={styles.radioItem}
          />
          
          {/* コミット履歴 */}
          {commits.map((commit) => (
            <DropdownMenuRadioItem
              key={commit.sha}
              value={commit.sha}
              label={`${commit.shortSha} - ${commit.message.split('\n')[0].substring(0, 30)}${commit.message.length > 30 ? '...' : ''}`}
              className={styles.radioItem}
            />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}
```

#### 2.5.5 AppBar.tsx の更新

```typescript
import { AvatarWithImage } from '@/components'
import { ChevronRight } from '@/icons'
import type { FC } from 'react'
import styles from './AppBar.module.css'
import { BranchDropdownMenu } from './BranchDropdownMenu'
import { CommitDropdownMenu } from './CommitDropdownMenu'
import { ProjectsDropdownMenu } from './ProjectsDropdownMenu'
import { getAuthUser } from './services/getAuthUser'

type Props = {
  currentProjectId?: string
  currentBranchOrCommit?: string
  currentBranch?: string // 特定のブランチを表示する場合（ルーティングbの場合）
  currentCommit?: string // 特定のコミットを表示する場合（ルーティングbの場合）
}

export const AppBar: FC<Props> = async ({
  currentProjectId,
  currentBranchOrCommit,
  currentBranch,
  currentCommit,
}) => {
  const { data: authUser } = await getAuthUser()

  const avatarUrl = authUser.user?.user_metadata?.avatar_url

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftSection}>
        {currentProjectId && (
          <div className={styles.breadcrumbs}>
            <ProjectsDropdownMenu currentProjectId={currentProjectId} />
            {currentBranchOrCommit && (
              <>
                <ChevronRight className={styles.chevronRight} />
                <BranchDropdownMenu
                  currentProjectId={currentProjectId}
                  currentBranchOrCommit={currentBranch || currentBranchOrCommit}
                />
                
                {/* 新しいコミットドロップダウンメニュー */}
                <ChevronRight className={styles.chevronRight} />
                <CommitDropdownMenu
                  currentProjectId={currentProjectId}
                  currentBranchOrCommit={currentCommit || currentBranchOrCommit}
                  currentBranch={currentBranch}
                />
              </>
            )}
          </div>
        )}
      </div>
      <div className={styles.rightSection}>
        {avatarUrl && (
          <AvatarWithImage src={avatarUrl} alt="User profile" size="sm" />
        )}
      </div>
    </div>
  )
}
```

#### 2.5.6 スタイルの実装

```css
/* CommitDropdownMenu.module.css */
.trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-2);
  background-color: var(--global-background);
  border: 1px solid var(--global-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.trigger:hover {
  background-color: var(--global-background-hover);
}

.nameAndTag {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.name {
  font-size: var(--font-size-3);
  font-weight: 500;
  color: var(--global-foreground);
}

.tag {
  font-size: var(--font-size-2);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-1);
  background-color: var(--primary-accent);
  color: var(--global-background);
}

.chevronIcon {
  width: 16px;
  height: 16px;
  color: var(--global-foreground-muted);
}

.content {
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-2);
  background-color: var(--global-background);
  border: 1px solid var(--global-border);
  border-radius: var(--border-radius-2);
  box-shadow: var(--shadow-md);
}

.radioItem {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-1);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.radioItem:hover {
  background-color: var(--global-background-hover);
}
```

### 2.6 技術的課題と解決策

1. **複数コミット取得の実装**
   - 現在の `@liam-hq/github` パッケージには最新コミットのみ取得する関数しかない
   - 解決策: Octokit API を直接使用して複数コミットを取得する関数を実装

2. **コミット表示の最適化**
   - コミットメッセージが長い場合の表示
   - 解決策: メッセージを適切に切り詰め、ツールチップで全文表示

3. **パフォーマンス考慮**
   - コミット履歴が多い場合のロード時間
   - 解決策: 表示数を制限（10件）し、必要に応じてページネーション実装

### 2.7 実装手順

1. 新規ルーティングファイルの作成
2. ルート定義の更新
3. コミット取得サービスの実装
4. CommitDropdownMenu コンポーネントの実装
5. AppBar.tsx の更新
6. スタイルの実装
7. テストとデバッグ

この実装により、ユーザーはブランチの現在・過去・未来のコミットを簡単に行き来できるようになります。

## 3. 実装上の考慮点と決定事項

### 3.1 複数コミット取得機能
- **アプローチ**: `@liam-hq/github` パッケージを拡張し、新しい関数 `getRepositoryCommits` を実装する
- 既存の `createOctokit` 関数を活用し、Octokit の `repos.listCommits` メソッドを呼び出す
- 実装例:
  ```typescript
  export const getRepositoryCommits = async (
    installationId: number,
    owner: string,
    repo: string,
    branch = 'main',
    perPage = 100
  ): Promise<Array<{
    sha: string,
    message: string,
    author: string,
    date: string
  }>> => {
    const octokit = await createOctokit(installationId)
    
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: perPage
      })
      
      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || '',
        date: commit.commit.author?.date || ''
      }))
    } catch (error) {
      console.error(`Error fetching commits for ${owner}/${repo}:`, error)
      return []
    }
  }
  ```

### 3.2 コミットの時系列比較
- **決定事項**: コミットの日時（author date, commit date）ではなく、コミット順（降順）で表示する
- GitHub APIから返されるコミットの順序をそのまま使用
- 未来/過去の判断もコミットリスト内の位置関係で決定

### 3.3 パフォーマンスの考慮
- **決定事項**: 初期実装では最大100件までのコミットを取得
- ページネーションは当面実装しない
- パフォーマンス問題が発生した場合は後日対応

### 3.4 新規ルーティングの統合
- 既存のルーティングおよびpage.tsxの構造を最大限尊重
- 新規ルーティングでも既存の `BranchDetailPage` コンポーネントを再利用
- レイアウトやコンテキスト共有の問題は実装後に確認・調整

### 3.5 コミットハッシュの表示形式
- **UI表示**: コミットハッシュは先頭8文字の短縮形で表示
- **URL**: 完全な40文字のハッシュをURLに使用
- ツールチップによる完全ハッシュの表示は初期実装では省略
