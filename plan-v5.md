# Public Share機能 実装計画 v5 - リアルタイム同期方式

## 🎯 新方針概要

### 戦略的決定
- **コンシューマー向け**: 直感的な操作性重視
- **リアルタイム同期**: Googleスプレッドシート型の即座共有
- **シンプルトグル**: 最小限の選択肢でユーザー体験最適化

### アーキテクチャ設計
- **超軽量テーブル**: 公開設定のみ保存（データ重複なし）
- **リアルタイム参照**: 既存テーブルを直接参照
- **トグル式制御**: レコード存在=公開、削除=非公開

---

## 🗂️ データベース設計

### 公開設定テーブル
```sql
CREATE TABLE public_share_settings (
  design_session_id UUID PRIMARY KEY REFERENCES design_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_public_share_settings_created_at ON public_share_settings(created_at);
```

### 運用フロー
```sql
-- 公開ON（トグルON）
INSERT INTO public_share_settings (design_session_id) 
VALUES ('abc-123');

-- 公開OFF（トグルOFF）
DELETE FROM public_share_settings 
WHERE design_session_id = 'abc-123';

-- 公開状態チェック
SELECT EXISTS(
  SELECT 1 FROM public_share_settings 
  WHERE design_session_id = 'abc-123'
);
```

### Row Level Security (RLS)
```sql
-- 公開ページからの読み取り許可
CREATE POLICY "public_sessions_read" ON design_sessions
FOR SELECT USING (
  id IN (
    SELECT design_session_id 
    FROM public_share_settings
  )
);

-- 関連テーブルも同様のRLS適用
CREATE POLICY "public_artifacts_read" ON artifacts
FOR SELECT USING (
  design_session_id IN (
    SELECT design_session_id 
    FROM public_share_settings
  )
);

CREATE POLICY "public_timeline_items_read" ON timeline_items
FOR SELECT USING (
  design_session_id IN (
    SELECT design_session_id 
    FROM public_share_settings
  )
);
```

---

## 🏗️ Skeleton Phase: リアルタイム方式実装

### 🔧 **Phase 1.1: 超シンプル公開設定テーブル (1日)**
**目標**: 最軽量の公開設定管理
**期間**: 1日
**レビューポイント**: テーブル設計の妥当性

#### Migration作成
```bash
pnpm -F db supabase:migration:new create_public_share_realtime
```

#### テーブル実装
```sql
-- 超シンプル設計
CREATE TABLE public_share_settings (
  design_session_id UUID PRIMARY KEY REFERENCES design_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- パフォーマンス用インデックス
CREATE INDEX idx_public_share_settings_created_at ON public_share_settings(created_at);
```

#### ✅ **Phase 1.1 完了判定**
- [ ] Migration適用成功
- [ ] テーブル作成確認
- [ ] TypeScript型生成確認

### 🔧 **Phase 1.2: トグル式API実装 (1日)**
**目標**: INSERT/DELETE によるシンプルな公開制御
**期間**: 1日
**レビューポイント**: API設計の妥当性

#### API設計
```typescript
// POST /api/design-sessions/[id]/share → 公開ON
// DELETE /api/design-sessions/[id]/share → 公開OFF
// GET /api/design-sessions/[id]/share → 公開状態取得
```

#### サービス実装
```typescript
// services/publicShare/togglePublicShare.ts
import { createClient } from '@/libs/db/server'
import { Result, ok, err } from 'neverthrow'

export const enablePublicShare = async (
  designSessionId: string
): Promise<Result<{ isPublic: true }, string>> => {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('public_share_settings')
    .insert({ design_session_id: designSessionId })
  
  if (error) {
    // 既に存在する場合はOKとして扱う
    if (error.code === '23505') { // unique violation
      return ok({ isPublic: true })
    }
    return err(`Failed to enable public share: ${error.message}`)
  }
  
  return ok({ isPublic: true })
}

export const disablePublicShare = async (
  designSessionId: string
): Promise<Result<{ isPublic: false }, string>> => {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('public_share_settings')
    .delete()
    .eq('design_session_id', designSessionId)
  
  if (error) {
    return err(`Failed to disable public share: ${error.message}`)
  }
  
  return ok({ isPublic: false })
}

export const getPublicShareStatus = async (
  designSessionId: string
): Promise<Result<{ isPublic: boolean }, string>> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('public_share_settings')
    .select('design_session_id')
    .eq('design_session_id', designSessionId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') { // not found
      return ok({ isPublic: false })
    }
    return err(`Failed to get public share status: ${error.message}`)
  }
  
  return ok({ isPublic: true })
}
```

#### API エンドポイント
```typescript
// app/api/design-sessions/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/db/server'
import { enablePublicShare, disablePublicShare, getPublicShareStatus } from '@/services/publicShare/togglePublicShare'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await getPublicShareStatus(params.id)
  
  return result.match(
    (success) => NextResponse.json(success),
    (error) => NextResponse.json({ error }, { status: 500 })
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // 認証チェック
  const authResult = await supabase.auth.getUser()
  if (authResult.error || !authResult.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const result = await enablePublicShare(params.id)
  
  return result.match(
    (success) => NextResponse.json(success),
    (error) => NextResponse.json({ error }, { status: 400 })
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // 認証チェック
  const authResult = await supabase.auth.getUser()
  if (authResult.error || !authResult.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const result = await disablePublicShare(params.id)
  
  return result.match(
    (success) => NextResponse.json(success),
    (error) => NextResponse.json({ error }, { status: 400 })
  )
}
```

#### ✅ **Phase 1.2 完了判定**
- [ ] API実装完了
- [ ] neverthrowパターン適用
- [ ] 認証・権限チェック実装

### 🔧 **Phase 1.3: Vercel v0風シェアUI統合 (1日)**
**目標**: Vercel v0スタイルのクリーンなシェア機能
**期間**: 1日
**レビューポイント**: UI/UXのミニマル性と直感性

#### トグルUI Hook
```typescript
// hooks/usePublicShareToggle.ts
import { useState, useEffect } from 'react'
import { useToast } from '@liam-hq/ui'

export const usePublicShareToggle = (designSessionId: string) => {
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // 初期状態取得
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/design-sessions/${designSessionId}/share`)
        if (response.ok) {
          const data = await response.json()
          setIsPublic(data.isPublic)
        }
      } catch (error) {
        console.error('Failed to check public share status:', error)
      }
    }
    
    if (designSessionId) {
      checkStatus()
    }
  }, [designSessionId])

  const togglePublicShare = async () => {
    setLoading(true)
    
    try {
      const method = isPublic ? 'DELETE' : 'POST'
      const response = await fetch(`/api/design-sessions/${designSessionId}/share`, {
        method
      })

      if (response.ok) {
        const data = await response.json()
        setIsPublic(data.isPublic)
        toast({
          title: data.isPublic ? 'Public sharing enabled' : 'Public sharing disabled',
          description: data.isPublic 
            ? 'Anyone with the link can view this session'
            : 'This session is now private',
          status: 'success'
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Failed to update sharing settings',
          description: errorData.error || 'Please try again',
          status: 'error'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to update sharing settings',
        description: 'Please try again',
        status: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    isPublic,
    loading,
    togglePublicShare
  }
}
```

#### Export Dropdown更新（Share統合）
```tsx
// components/SessionDetailPage/components/Output/components/Header/ExportDropdown.tsx
import { Share, ChevronDown } from '@liam-hq/ui'

export const ExportDropdown: FC<Props> = ({
  schema,
  artifactDoc,
  cumulativeOperations,
  designSessionId,
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  return (
    <>
      <div className="flex gap-2">
        {/* Export Dropdown */}
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline-secondary"
              size="md"
              rightIcon={<ChevronDown size={16} />}
              className={styles.button}
            >
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent align="end" sideOffset={8}>
              {/* 既存のエクスポートオプション */}
              {artifactDoc && cumulativeOperations.length > 0 && (
                <DropdownMenuItem
                  leftIcon={<FileText size={16} />}
                  onSelect={handleCopyAIPrompt}
                >
                  Prompt for AI Agent
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                leftIcon={<Copy size={16} />}
                onSelect={handleCopyPostgreSQL}
              >
                Copy PostgreSQL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
        
        {/* Share Button (v0 style) */}
        <Button
          variant="outline-secondary"
          size="md"
          leftIcon={<Share size={16} />}
          onClick={() => setIsShareDialogOpen(true)}
          className={styles.shareButton}
        >
          Share
        </Button>
      </div>
      
      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        designSessionId={designSessionId}
      />
    </>
  )
}
```

#### Vercel v0風 Share Dialog
```tsx
// components/ShareDialog/ShareDialog.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarImage,
  AvatarFallback,
  useToast
} from '@liam-hq/ui'
import { Lock, Link, Copy, Check } from '@liam-hq/ui'
import { usePublicShareToggle } from '@/hooks/usePublicShareToggle'

type Props = {
  isOpen: boolean
  onClose: () => void
  designSessionId: string
}

export const ShareDialog: FC<Props> = ({
  isOpen,
  onClose,
  designSessionId
}) => {
  const { isPublic, loading, togglePublicShare } = usePublicShareToggle(designSessionId)
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const handleVisibilityChange = async (value: string) => {
    const shouldBePublic = value === 'link'
    if (shouldBePublic !== isPublic) {
      await togglePublicShare()
    }
  }

  const copyLink = async () => {
    if (!isPublic) return
    
    const publicUrl = `${window.location.origin}/public/sessions/${designSessionId}`
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Link copied',
      status: 'success'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Share</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* People with access */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">People with access</h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/api/user/avatar" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm text-white">You</div>
                <div className="text-xs text-gray-400">your@email.com</div>
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Visibility</h4>
            <div className="flex gap-2">
              <Select
                value={isPublic ? 'link' : 'private'}
                onValueChange={handleVisibilityChange}
                disabled={loading}
              >
                <SelectTrigger className="flex-1 bg-gray-800 border-gray-700 text-white">
                  <div className="flex items-center gap-2">
                    {isPublic ? (
                      <Link className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="private" className="text-white">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="link" className="text-white">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Anyone with the link
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {isPublic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  disabled={loading}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### ✅ **Phase 1.3 完了判定**
- [ ] Vercel v0風 Share Dialog実装
- [ ] Visibility選択機能（Private/Anyone with the link）
- [ ] Copy Link機能
- [ ] People with access表示

### 🔧 **Phase 1.4: リアルタイム公開ページ (1-2日)**
**目標**: 既存テーブル参照によるリアルタイム表示
**期間**: 1-2日
**レビューポイント**: RLS適用とパフォーマンス

#### 公開ページ実装
```tsx
// app/public/sessions/[id]/page.tsx
import { createClient } from '@/libs/db/server'
import { notFound } from 'next/navigation'

export default async function PublicSessionPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createClient()
  
  // 公開設定確認
  const { data: publicSettings } = await supabase
    .from('public_share_settings')
    .select('design_session_id, created_at')
    .eq('design_session_id', params.id)
    .single()
  
  if (!publicSettings) {
    notFound()
  }
  
  // 実データ取得（RLSにより自動的に公開データのみ）
  const { data: session, error } = await supabase
    .from('design_sessions')
    .select(`
      *,
      users!design_sessions_created_by_user_id_fkey(name),
      organizations!design_sessions_organization_id_fkey(name)
    `)
    .eq('id', params.id)
    .single()
    
  if (error || !session) {
    notFound()
  }
  
  // 関連データ取得
  const [artifactsResult, timelineResult] = await Promise.all([
    supabase
      .from('artifacts')
      .select('*')
      .eq('design_session_id', params.id),
    supabase
      .from('timeline_items')
      .select('*')
      .eq('design_session_id', params.id)
      .order('created_at')
  ])
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">Public Session</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{session.name}</h1>
        
        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{session.users.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{session.organizations.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(session.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* リアルタイム表示 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Conversation */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">AI Conversation</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {timelineResult.data?.map((item) => (
              <div key={item.id} className="p-3 rounded border">
                <div className="text-sm text-gray-500 mb-1">{item.type}</div>
                <div className="text-sm">{item.content}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Design Artifacts */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Design Artifacts</h2>
          <div className="space-y-4">
            {artifactsResult.data?.map((artifact) => (
              <div key={artifact.id} className="p-4 border rounded">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(artifact.artifact, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-gray-500">
        <p>🔄 This page updates in real-time as the session is edited</p>
        <p>Created with Liam ERD - Interactive Database Design Tool</p>
      </div>
    </div>
  )
}
```

#### ✅ **Phase 1.4 完了判定**
- [ ] 公開ページ実装
- [ ] RLS適用確認
- [ ] リアルタイム表示確認

---

## 🎯 Skeleton Phase完了判定

### 📋 総合チェックリスト
- [ ] **データベース**: `public_share_settings`テーブル作成
- [ ] **API**: トグル式公開制御API実装
- [ ] **UI**: シンプルトグルスイッチ統合
- [ ] **公開ページ**: リアルタイム表示実装
- [ ] **E2E**: トグルON → 公開ページ確認 → トグルOFF

### 🔍 **レビューポイント**
1. **シンプルさ**: UIが直感的で迷わない
2. **パフォーマンス**: 公開ページの応答速度
3. **セキュリティ**: RLSの適切な適用
4. **リアルタイム**: 編集内容の即座反映

---

## 🚀 Muscle Phase概要（参考）

Skeleton Phase完了後の拡張項目：

### 🥩 **Muscle Phase実装範囲**
- **SEO最適化**: メタタグ、OG画像
- **SNSシェア**: Twitter Card、LinkedIn対応
- **ERD表示**: React Flow統合
- **パフォーマンス**: キャッシュ戦略
- **監視**: アクセス解析、エラー追跡

### 🎨 **Polish Phase実装範囲**
- **デザイン**: 完全なUI/UX
- **アニメーション**: スムーズなトランジション
- **国際化**: 多言語対応
- **アクセシビリティ**: WCAG準拠

---

## 📊 技術スタック

### **データベース**
- PostgreSQL (Supabase)
- Row Level Security (RLS)

### **バックエンド**  
- Next.js App Router
- TypeScript
- neverthrow (エラーハンドリング)

### **フロントエンド**
- React 18
- Valtio (状態管理)
- @liam-hq/ui (UIライブラリ)
- CSS Modules

### **認証・認可**
- Supabase Auth
- RLS Policy

この計画により、シンプルで直感的なリアルタイム同期型Public Share機能を段階的に実装できます。
