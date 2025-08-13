# Public Share機能 実装計画 v4 - スケルトンレビュー方式

## 概要

Public Share機能の大規模エピックを**スケルトンレビュー方式**で段階的に実装・検証する計画。各段階で基本骨格から詳細実装へと段階的に肉付けし、早期フィードバックによりリスクを軽減します。

### スケルトンレビュー方式の採用理由

- **大規模エピック**: 5テーブル + API + UI + 公開ページの複合機能
- **不確実性**: Public Share のUX・セキュリティ要件が未確定
- **リスク軽減**: 早期に方向性を検証し、手戻りを防止
- **段階的価値提供**: 各段階で動作する機能を提供

## スケルトンレビュー段階設計

### 🔧 **Skeleton Phase (骨格実装)**
**目標**: 基本的なデータフローと最小限のUXを実現
**期間**: 3-5日
**レビューポイント**: アーキテクチャ・データ設計の妥当性

### 🥩 **Muscle Phase (機能肉付け)**
**目標**: 完全なPublic Share機能とUI実装
**期間**: 5-7日  
**レビューポイント**: 機能完成度・UX・セキュリティ

### 🎨 **Polish Phase (仕上げ・最適化)**
**目標**: SEO・SNS・パフォーマンス最適化
**期間**: 3-4日
**レビューポイント**: 本番ready・メトリクス・監視

---

## 🔧 Skeleton Phase: 基本骨格実装

### 実装スコープ
- ✅ **最小限のデータ構造**: 1テーブルのみで概念実証
- ✅ **基本API**: 作成・取得・削除の骨格
- ✅ **最小UI**: Export Dropdownへの追加のみ
- ✅ **動作確認**: E2Eでの基本フロー検証

### Phase 1.1: データベース骨格 (1日)

#### 最小限テーブル作成
```sql
-- Skeleton実装: design_sessionsのコピーのみ
CREATE TABLE public_design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_design_session_id UUID NOT NULL REFERENCES design_sessions(id),
  name TEXT NOT NULL,
  created_by_user_name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(original_design_session_id)
);

CREATE INDEX idx_public_design_sessions_original_id 
ON public_design_sessions(original_design_session_id);
```

#### 骨格コピー関数
```sql
CREATE OR REPLACE FUNCTION copy_session_to_public_skeleton(p_design_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_public_session_id UUID;
  v_session_record RECORD;
BEGIN
  -- 既存チェック
  SELECT id INTO v_public_session_id 
  FROM public_design_sessions 
  WHERE original_design_session_id = p_design_session_id;
  
  IF v_public_session_id IS NOT NULL THEN
    RETURN v_public_session_id;
  END IF;
  
  -- 基本情報のみコピー
  SELECT ds.*, u.name as user_name, o.name as org_name
  INTO v_session_record
  FROM design_sessions ds
  JOIN users u ON ds.created_by_user_id = u.id
  JOIN organizations o ON ds.organization_id = o.id
  WHERE ds.id = p_design_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Design session not found: %', p_design_session_id;
  END IF;
  
  INSERT INTO public_design_sessions (
    original_design_session_id,
    name,
    created_by_user_name,
    organization_name,
    created_at
  ) VALUES (
    p_design_session_id,
    v_session_record.name,
    v_session_record.user_name,
    v_session_record.org_name,
    v_session_record.created_at
  ) RETURNING id INTO v_public_session_id;
  
  RETURN v_public_session_id;
END;
$$ LANGUAGE plpgsql;
```

#### ✅ **Skeleton Review Point 1.1**
- [ ] テーブル設計の妥当性
- [ ] 関数の動作確認
- [ ] パフォーマンス基本検証

### Phase 1.2: API骨格 (1日)

#### 最小限サービス
```typescript
// services/publicShare/createPublicSession.ts (skeleton版)
export const createPublicSessionSkeleton = async (
  designSessionId: string
): Promise<Result<{ publicSessionId: string; publicUrl: string }, string>> => {
  const supabase = createClient()
  
  const copyResult = await supabase.rpc(
    'copy_session_to_public_skeleton',
    { p_design_session_id: designSessionId }
  )
  
  if (copyResult.error) {
    return err(`Failed to create public session: ${copyResult.error.message}`)
  }
  
  const publicSessionId = copyResult.data as string
  const publicUrl = `${window.location.origin}/public/sessions/${publicSessionId}`
  
  return ok({ publicSessionId, publicUrl })
}
```

#### 骨格API
```typescript
// app/api/design-sessions/[id]/share/route.ts (skeleton版)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // 最小限の認証チェックのみ
  const authResult = await supabase.auth.getUser()
  if (authResult.error || !authResult.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const result = await createPublicSessionSkeleton(params.id)
  
  return result.match(
    (success) => NextResponse.json(success),
    (error) => NextResponse.json({ error }, { status: 400 })
  )
}
```

#### ✅ **Skeleton Review Point 1.2**
- [ ] API設計の妥当性
- [ ] エラーハンドリング確認
- [ ] 認証フローの動作確認

### Phase 1.3: UI骨格 (1日)

#### 最小限Export Dropdown拡張
```tsx
// ExportDropdown.tsx への最小限追加
const handleSkeletonShare = async () => {
  const response = await fetch(`/api/design-sessions/${designSessionId}/share`, {
    method: 'POST'
  })
  
  if (response.ok) {
    const data = await response.json()
    // 最初は単純にalertで表示
    alert(`Public URL: ${data.publicUrl}`)
  } else {
    alert('Failed to create public share')
  }
}

// 既存のDropdownMenuContentに追加
<DropdownMenuItem leftIcon={<Share size={16} />} onSelect={handleSkeletonShare}>
  Public Share (Beta)
</DropdownMenuItem>
```

#### ✅ **Skeleton Review Point 1.3**
- [ ] UX基本フローの妥当性
- [ ] Export Dropdownとの統合確認
- [ ] 最小限のエラーハンドリング

### Phase 1.4: 公開ページ骨格 (1-2日)

#### 最小限公開ページ
```tsx
// app/public/sessions/[id]/page.tsx (skeleton版)
export default async function PublicSessionPageSkeleton({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createClient()
  
  const { data: session, error } = await supabase
    .from('public_design_sessions')
    .select('*')
    .eq('id', params.id)
    .single()
    
  if (error || !session) {
    return <div>Session not found</div>
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">{session.name}</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Created by:</strong> {session.created_by_user_name}</p>
        <p><strong>Organization:</strong> {session.organization_name}</p>
        <p><strong>Created at:</strong> {new Date(session.created_at).toLocaleDateString()}</p>
      </div>
      <div className="mt-8 p-4 border rounded">
        <p>🚧 Timeline Items, Artifacts, ERD will be added in Muscle Phase</p>
      </div>
    </div>
  )
}
```

#### ✅ **Skeleton Review Point 1.4**
- [ ] 公開ページの基本レイアウト
- [ ] URLアクセス可能性
- [ ] 基本的なSEO要素

### 🎯 **Skeleton Phase完了判定**
- [ ] E2Eテスト: Export → 公開URL生成 → 公開ページ表示
- [ ] 基本セキュリティ確認: 認証・権限チェック
- [ ] パフォーマンス基本確認: 10セッション程度での動作
- [ ] **ステークホルダーレビュー**: 基本コンセプト・UXの方向性確認

---

## 🥩 Muscle Phase: 機能肉付け

### 実装スコープ
- ✅ **完全なデータ構造**: 全5テーブル実装
- ✅ **リッチUI**: ダイアログ・確認フロー・SNSシェア
- ✅ **完全な公開ページ**: ERD・SQL・Artifact表示
- ✅ **セキュリティ強化**: 権限チェック・Rate Limiting

### Phase 2.1: データ構造完成 (2日)

#### 残り4テーブル追加
```sql
-- 2. public_artifacts
CREATE TABLE public_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_design_session_id UUID NOT NULL REFERENCES public_design_sessions(id) ON DELETE CASCADE,
  artifact JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_artifacts_session_id ON public_artifacts(public_design_session_id);

-- 3. public_timeline_items  
CREATE TABLE public_timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_design_session_id UUID NOT NULL REFERENCES public_design_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- 'user', 'assistant', 'schema_version', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_timeline_items_session_id ON public_timeline_items(public_design_session_id);

-- 4. public_building_schemas
CREATE TABLE public_building_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_design_session_id UUID NOT NULL REFERENCES public_design_sessions(id) ON DELETE CASCADE,
  schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_building_schemas_session_id ON public_building_schemas(public_design_session_id);

-- 5. public_building_schema_versions
CREATE TABLE public_building_schema_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_building_schema_id UUID NOT NULL REFERENCES public_building_schemas(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  patch JSONB,
  reverse_patch JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_building_schema_versions_schema_id ON public_building_schema_versions(public_building_schema_id);
```

#### 完全コピー関数
```sql
CREATE OR REPLACE FUNCTION copy_session_to_public(p_design_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_public_session_id UUID;
  v_session_record RECORD;
  v_artifact_record RECORD;
  v_timeline_record RECORD;
  v_schema_record RECORD;
  v_version_record RECORD;
  v_public_schema_id UUID;
BEGIN
  -- 既存の公開セッションをチェック
  SELECT id INTO v_public_session_id 
  FROM public_design_sessions 
  WHERE original_design_session_id = p_design_session_id;
  
  IF v_public_session_id IS NOT NULL THEN
    RETURN v_public_session_id;
  END IF;
  
  -- Design Session データ取得・コピー
  SELECT ds.*, u.name as user_name, o.name as org_name
  INTO v_session_record
  FROM design_sessions ds
  JOIN users u ON ds.created_by_user_id = u.id
  JOIN organizations o ON ds.organization_id = o.id
  WHERE ds.id = p_design_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Design session not found: %', p_design_session_id;
  END IF;
  
  -- Public Design Session作成
  INSERT INTO public_design_sessions (
    original_design_session_id,
    name,
    created_by_user_name,
    organization_name,
    created_at
  ) VALUES (
    p_design_session_id,
    v_session_record.name,
    v_session_record.user_name,
    v_session_record.org_name,
    v_session_record.created_at
  ) RETURNING id INTO v_public_session_id;
  
  -- Artifacts コピー
  FOR v_artifact_record IN 
    SELECT * FROM artifacts WHERE design_session_id = p_design_session_id
  LOOP
    INSERT INTO public_artifacts (
      public_design_session_id,
      artifact,
      created_at,
      updated_at
    ) VALUES (
      v_public_session_id,
      v_artifact_record.artifact,
      v_artifact_record.created_at,
      v_artifact_record.updated_at
    );
  END LOOP;
  
  -- Timeline Items コピー（そのままコピー）
  FOR v_timeline_record IN 
    SELECT * FROM timeline_items WHERE design_session_id = p_design_session_id
  LOOP
    INSERT INTO public_timeline_items (
      public_design_session_id,
      content,
      type,
      created_at,
      updated_at
    ) VALUES (
      v_public_session_id,
      v_timeline_record.content, -- ユーザー責任で機密情報は事前に確認済み
      v_timeline_record.type,
      v_timeline_record.created_at,
      v_timeline_record.updated_at
    );
  END LOOP;
  
  -- Building Schemas コピー
  FOR v_schema_record IN 
    SELECT * FROM building_schemas WHERE design_session_id = p_design_session_id
  LOOP
    INSERT INTO public_building_schemas (
      public_design_session_id,
      schema,
      created_at
    ) VALUES (
      v_public_session_id,
      v_schema_record.schema,
      v_schema_record.created_at
    ) RETURNING id INTO v_public_schema_id;
    
    -- Schema Versions コピー
    FOR v_version_record IN 
      SELECT * FROM building_schema_versions WHERE building_schema_id = v_schema_record.id
    LOOP
      INSERT INTO public_building_schema_versions (
        public_building_schema_id,
        number,
        patch,
        reverse_patch,
        created_at
      ) VALUES (
        v_public_schema_id,
        v_version_record.number,
        v_version_record.patch,
        v_version_record.reverse_patch,
        v_version_record.created_at
      );
    END LOOP;
  END LOOP;
  
  RETURN v_public_session_id;
END;
$$ LANGUAGE plpgsql;
```

#### ✅ **Muscle Review Point 2.1**
- [ ] 全テーブルの整合性確認
- [ ] データコピーの完全性検証
- [ ] 外部キー制約・CASCADE動作確認

### Phase 2.2: UI完成 (2日)

#### PublicShareDialog実装
```tsx
// frontend/apps/app/components/PublicShareDialog/PublicShareDialog.tsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Checkbox,
  Label,
  Badge,
  AlertTriangle,
  Globe,
  Eye,
  Users
} from '@liam-hq/ui'
import { usePublicShare } from '../hooks/usePublicShare'
import { PublicShareSuccessDialog } from './PublicShareSuccessDialog'

type Props = {
  isOpen: boolean
  onClose: () => void
  designSessionId: string
}

export const PublicShareDialog: FC<Props> = ({
  isOpen,
  onClose,
  designSessionId
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  const {
    createPublicShare,
    deletePublicShare,
    isLoading,
    publicUrl,
    error,
    existingPublicSession
  } = usePublicShare(designSessionId)

  const handleCreateShare = async () => {
    const result = await createPublicShare()
    if (result.success) {
      onClose()
      setShowSuccessDialog(true)
    }
  }

  const handleDeleteShare = async () => {
    await deletePublicShare()
    onClose()
  }

  const canCreate = agreedToTerms

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Public Share Settings
            </DialogTitle>
            <DialogDescription>
              Make this design session publicly accessible to anyone with the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 既存の公開セッション */}
            {existingPublicSession && (
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertTitle>Already Shared</AlertTitle>
                <AlertDescription>
                  This session is already publicly shared.
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                    {existingPublicSession.publicUrl}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 公開範囲の説明 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                What will be shared publicly?
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• AI conversation history (timeline items)</li>
                <li>• Design artifacts and documentation</li>
                <li>• Interactive ER diagram and schema</li>
                <li>• SQL migration scripts</li>
                <li>• Creator name and organization (anonymized)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Please review your content carefully before sharing. You are responsible for ensuring no sensitive information is included.
              </p>
            </div>

            {/* 利用規約確認 */}
            {!existingPublicSession && (
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="terms" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to share this design session publicly
                  </Label>
                  <p className="text-xs text-gray-500">
                    By sharing, you confirm that this content doesn't contain proprietary or confidential information.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {existingPublicSession && (
                <Button
                  variant="outline"
                  onClick={handleDeleteShare}
                  disabled={isLoading}
                >
                  Stop Sharing
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {existingPublicSession ? (
                <Button
                  onClick={() => {
                    onClose()
                    setShowSuccessDialog(true)
                  }}
                >
                  View Share Settings
                </Button>
              ) : (
                <Button
                  onClick={handleCreateShare}
                  disabled={!canCreate || isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Public Share'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PublicShareSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        publicUrl={publicUrl || existingPublicSession?.publicUrl || ''}
        designSessionName="Sample Design Session" // TODO: 実際の名前を渡す
      />
    </>
  )
}
```

#### usePublicShare Hook
```tsx
// frontend/apps/app/components/hooks/usePublicShare.ts
import { useState, useEffect } from 'react'
import { createPublicSession } from '@/services/publicShare/createPublicSession'

export type ExistingPublicSession = {
  id: string
  publicUrl: string
  sharedAt: string
}

export const usePublicShare = (designSessionId: string) => {
  const [isLoading, setIsLoading] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existingPublicSession, setExistingPublicSession] = useState<ExistingPublicSession | null>(null)

  // 既存の公開セッションをチェック
  useEffect(() => {
    const checkExistingSession = async () => {
      const response = await fetch(`/api/design-sessions/${designSessionId}/share`)
      if (response.ok) {
        const data = await response.json()
        if (data.publicSessionId) {
          setExistingPublicSession({
            id: data.publicSessionId,
            publicUrl: data.publicUrl,
            sharedAt: data.sharedAt
          })
        }
      }
    }

    if (designSessionId) {
      checkExistingSession()
    }
  }, [designSessionId])

  const createPublicShare = async () => {
    setIsLoading(true)
    setError(null)

    const response = await fetch(`/api/design-sessions/${designSessionId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Failed to create public share')
      setIsLoading(false)
      return { success: false }
    }

    setPublicUrl(data.publicUrl)
    setExistingPublicSession({
      id: data.publicSessionId,
      publicUrl: data.publicUrl,
      sharedAt: new Date().toISOString()
    })

    setIsLoading(false)
    return { success: true }
  }

  const deletePublicShare = async () => {
    setIsLoading(true)
    setError(null)

    const response = await fetch(`/api/design-sessions/${designSessionId}/share`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.error || 'Failed to delete public share')
      setIsLoading(false)
      return { success: false }
    }

    setExistingPublicSession(null)
    setPublicUrl(null)
    setIsLoading(false)
    return { success: true }
  }

  return {
    createPublicShare,
    deletePublicShare,
    isLoading,
    publicUrl,
    error,
    existingPublicSession
  }
}
```

#### ✅ **Muscle Review Point 2.2**
- [ ] UI/UXの完成度確認
- [ ] 全エラーケースのハンドリング
- [ ] アクセシビリティ確認

### Phase 2.3: 公開ページ完成 (2-3日)

#### 完全なPublic Session Detail Page
```tsx
// app/public/sessions/[id]/page.tsx
import type { Schema } from '@liam-hq/schema'
import { schemaSchema } from '@liam-hq/schema'
import { safeParse } from 'valibot'
import { createClient } from '@/lib/supabase/server'
import { PublicSessionDetailPageClient } from './PublicSessionDetailPageClient'

export default async function PublicSessionDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createClient()
  
  // Public Session情報取得
  const sessionResult = await supabase
    .from('public_design_sessions')
    .select('*')
    .eq('id', params.id)
    .single()
    
  if (sessionResult.error || !sessionResult.data) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Session Not Found</h1>
        <p className="text-gray-600">The public session you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }
  
  const session = sessionResult.data
  
  // 関連データ取得
  const [artifactsResult, timelineResult, schemasResult] = await Promise.all([
    supabase
      .from('public_artifacts')
      .select('*')
      .eq('public_design_session_id', params.id),
    supabase
      .from('public_timeline_items')
      .select('*')
      .eq('public_design_session_id', params.id)
      .order('created_at'),
    supabase
      .from('public_building_schemas')
      .select(`
        *,
        public_building_schema_versions(*)
      `)
      .eq('public_design_session_id', params.id)
  ])
  
  if (artifactsResult.error || timelineResult.error || schemasResult.error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Error Loading Session</h1>
        <p className="text-gray-600">Failed to load session data. Please try again later.</p>
      </div>
    )
  }
  
  const artifacts = artifactsResult.data || []
  const timelineItems = timelineResult.data || []
  const schemas = schemasResult.data || []
  
  // 最新スキーマを取得
  const latestSchema = schemas[0]
  const parsedSchema = latestSchema ? safeParse(schemaSchema, latestSchema.schema) : null
  const displaySchema = parsedSchema?.success ? parsedSchema.output : null
  
  return (
    <PublicSessionDetailPageClient
      session={session}
      artifacts={artifacts}
      timelineItems={timelineItems}
      schemas={schemas}
      displaySchema={displaySchema}
    />
  )
}
```

#### Read Only制御
```tsx
// components/PublicSessionDetailPageClient.tsx
'use client'

import type { Schema } from '@liam-hq/schema'
import { type FC, useState } from 'react'
import { Badge, Globe, Calendar, User, Building } from '@liam-hq/ui'
import { PublicOutput } from './components/PublicOutput'
import { PublicTimeline } from './components/PublicTimeline'

type Props = {
  session: any // Public session data
  artifacts: any[]
  timelineItems: any[]
  schemas: any[]
  displaySchema: Schema | null
}

export const PublicSessionDetailPageClient: FC<Props> = ({
  session,
  artifacts,
  timelineItems,
  schemas,
  displaySchema
}) => {
  const [activeTab, setActiveTab] = useState('timeline')
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-6 w-6 text-blue-600" />
          <Badge variant="secondary">Public Share</Badge>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{session.name}</h1>
        
        <div className="flex items-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{session.created_by_user_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{session.organization_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(session.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timeline (Read Only) */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">AI Conversation</h2>
          <PublicTimeline 
            timelineItems={timelineItems}
            onArtifactLinkClick={() => setActiveTab('artifact')}
          />
        </div>
        
        {/* Output (Read Only) */}
        <div className="space-y-4">
          <PublicOutput
            schema={displaySchema}
            artifacts={artifacts}
            schemas={schemas}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-gray-500">
        <p>This is a public share of an AI-powered database design session.</p>
        <p>Created with Liam ERD - Interactive Database Design Tool</p>
      </div>
    </div>
  )
}
```

#### ✅ **Muscle Review Point 2.3**
- [ ] 全コンテンツの表示確認
- [ ] Read Only制御の完全性
- [ ] レスポンシブ対応

### 🎯 **Muscle Phase完了判定**
- [ ] フルE2Eテスト: 全フロー動作確認
- [ ] セキュリティテスト: 権限・データ漏洩チェック
- [ ] ユーザビリティテスト: 実際のユーザーでの操作確認
- [ ] **ステークホルダーレビュー**: 機能完成度・リリース可否判定

---

## 🎨 Polish Phase: 仕上げ・最適化

### 実装スコープ
- ✅ **SEO最適化**: OG Tags・構造化データ
- ✅ **SNS連携**: Twitter Card・動的OG画像
- ✅ **パフォーマンス**: SSR・CDN・画像最適化
- ✅ **監視・分析**: アクセス解析・エラー監視

### Phase 3.1: SEO・SNS最適化 (1-2日)

#### メタデータ実装
```tsx
// app/public/sessions/[id]/layout.tsx
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: session } = await supabase
    .from('public_design_sessions')
    .select('*')
    .eq('id', params.id)
    .single()
    
  if (!session) {
    return {
      title: 'Session Not Found - Liam ERD',
      description: 'The requested design session could not be found.'
    }
  }
  
  const title = `${session.name} - AI Database Design by ${session.created_by_user_name}`
  const description = `Explore this AI-generated database design session created by ${session.created_by_user_name} from ${session.organization_name}. Interactive ER diagrams, SQL migrations, and design artifacts.`
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/public/sessions/${params.id}`
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/public-session?id=${params.id}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Liam ERD',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: title
      }],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: url
    }
  }
}

export default function PublicSessionLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
```

#### 動的OG画像生成
```tsx
// app/api/og/public-session/route.tsx
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return new Response('Missing session ID', { status: 400 })
  }
  
  const supabase = createClient()
  
  const { data: session } = await supabase
    .from('public_design_sessions')
    .select('*')
    .eq('id', id)
    .single()
    
  if (!session) {
    return new Response('Session not found', { status: 404 })
  }
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f2937',
          color: 'white',
          fontFamily: 'Inter'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginRight: 16 }}>🗂️</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>Liam ERD</div>
        </div>
        
        <div style={{ 
          fontSize: 48, 
          fontWeight: 'bold', 
          textAlign: 'center',
          marginBottom: 24,
          maxWidth: '80%'
        }}>
          {session.name}
        </div>
        
        <div style={{ 
          fontSize: 24,
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: 32
        }}>
          AI Database Design by {session.created_by_user_name}
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#374151',
          padding: '12px 24px',
          borderRadius: 8
        }}>
          <span style={{ fontSize: 20 }}>🌐 Public Design Session</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}
```

#### ✅ **Polish Review Point 3.1**
- [ ] SEOツールでの検証
- [ ] SNSプレビュー確認
- [ ] OG画像品質チェック

### Phase 3.2: パフォーマンス最適化 (1日)

#### SSR・キャッシュ戦略
```tsx
// app/public/sessions/[id]/page.tsx に追加
export const revalidate = 3600 // 1時間キャッシュ
export const dynamic = 'force-dynamic' // 動的レンダリング強制

// next.config.js に追加
module.exports = {
  async headers() {
    return [
      {
        source: '/public/sessions/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400'
          }
        ]
      }
    ]
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  }
}
```

#### ✅ **Polish Review Point 3.2**
- [ ] Core Web Vitals測定
- [ ] キャッシュ効果確認
- [ ] 大量データでの性能検証

### Phase 3.3: 監視・分析 (1日)

#### アクセス解析
```tsx
// lib/analytics/publicShareAnalytics.ts
import { createClient } from '@/lib/supabase/client'

export const trackPublicSessionView = async (sessionId: string) => {
  try {
    await fetch('/api/analytics/public-session-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
  } catch (error) {
    console.warn('Analytics tracking failed:', error)
  }
}

export const trackPublicSessionCreated = async (sessionId: string) => {
  try {
    await fetch('/api/analytics/public-session-created', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
  } catch (error) {
    console.warn('Analytics tracking failed:', error)
  }
}

// app/api/analytics/public-session-view/route.ts
export async function POST(request: Request) {
  const { sessionId } = await request.json()
  
  // Supabase Analytics テーブルに記録
  const supabase = createClient()
  await supabase.from('public_session_analytics').insert({
    session_id: sessionId,
    event_type: 'view',
    timestamp: new Date().toISOString(),
    user_agent: request.headers.get('user-agent'),
    referer: request.headers.get('referer')
  })
  
  return Response.json({ success: true })
}
```

#### エラー監視
```tsx
// sentry.client.config.ts に追加
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [/^\/api\/public\//]
    })
  ],
  beforeSend(event) {
    // Public Share 関連エラーにタグ追加
    if (event.request?.url?.includes('/public/sessions/')) {
      event.tags = {
        ...event.tags,
        feature: 'public-share',
        page_type: 'public-session'
      }
    }
    return event
  }
})

// components/ErrorBoundary/PublicShareErrorBoundary.tsx
import * as Sentry from '@sentry/nextjs'
import { ErrorBoundary } from 'react-error-boundary'

function PublicShareErrorFallback({ error }: { error: Error }) {
  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-4">
        We're sorry, but there was an error loading this public session.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  )
}

export const PublicShareErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      FallbackComponent={PublicShareErrorFallback}
      onError={(error, errorInfo) => {
        Sentry.captureException(error, {
          tags: { feature: 'public-share' },
          extra: errorInfo
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

#### ✅ **Polish Review Point 3.3**
- [ ] メトリクス収集確認
- [ ] アラート動作確認
- [ ] ダッシュボード確認

### 🎯 **Polish Phase完了判定**
- [ ] 本番環境での性能確認
- [ ] 監視・アラート動作確認  
- [ ] ドキュメント・運用手順整備
- [ ] **最終ステークホルダーレビュー**: リリース承認

---

## レビューゲート設計

### 各段階のレビュー観点

#### 🔧 Skeleton Phase Review
- **アーキテクチャ**: データ設計・API設計の妥当性
- **実現可能性**: 技術的課題・制約の確認
- **方向性**: プロダクト要件との整合性
- **継続判断**: Muscle Phaseへの移行可否

#### 🥩 Muscle Phase Review  
- **機能完成度**: 要件の充足度・品質
- **ユーザビリティ**: UX・操作性の確認
- **セキュリティ**: 脆弱性・データ保護の確認
- **リリース判断**: Polish Phaseへの移行可否

#### 🎨 Polish Phase Review
- **本番Ready**: パフォーマンス・監視・運用準備
- **マーケティング**: SEO・SNS対応・PR準備
- **品質保証**: 最終的な品質確認
- **リリース承認**: 本番リリースの最終判断

## リスク軽減策

### 早期リスク検出
- **Skeleton Phase**: アーキテクチャ・技術リスクの早期発見
- **段階的投資**: 各段階で継続可否を判断、沈没コスト回避
- **並行開発**: UI mockup と API開発の並行進行

### 品質担保
- **レビューゲート**: 各段階での品質確認ポイント
- **自動テスト**: 各段階でのテストカバレッジ向上
- **ドキュメント**: 各段階での設計文書更新

### ステークホルダー連携
- **定期レビュー**: 週次での進捗・課題共有
- **デモ提供**: 各段階での動作する機能デモ
- **フィードバック**: 早期のユーザーフィードバック収集

## 想定スケジュール

```
Week 1: 🔧 Skeleton Phase (3-5日)
├─ Day 1: データベース骨格
├─ Day 2: API骨格  
├─ Day 3: UI骨格
├─ Day 4-5: 公開ページ骨格 + Review
└─ 📋 Skeleton Review Gate

Week 2-3: 🥩 Muscle Phase (5-7日)  
├─ Day 1-2: データ構造完成
├─ Day 3-4: UI完成
├─ Day 5-7: 公開ページ完成 + Review
└─ 📋 Muscle Review Gate

Week 3-4: 🎨 Polish Phase (3-4日)
├─ Day 1-2: SEO・SNS最適化
├─ Day 3: パフォーマンス最適化  
├─ Day 4: 監視・分析 + Review
└─ 📋 Polish Review Gate

Total: 11-16日 (2-3週間)
```

## 成功指標

### Skeleton Phase
- [ ] 基本E2Eフロー動作 (作成→URL生成→表示)
- [ ] API Response Time < 500ms
- [ ] ステークホルダー承認率 > 80%

### Muscle Phase  
- [ ] 全機能テストPass率 > 95%
- [ ] ユーザビリティテスト満足度 > 4.0/5.0
- [ ] セキュリティ監査Pass

### Polish Phase
- [ ] Core Web Vitals All Green
- [ ] SEOスコア > 90/100  
- [ ] 監視カバレッジ > 95%

この段階的アプローチにより、大規模なPublic Share機能を確実かつ効率的に実装し、各段階でのリスクを最小化しながら高品質な機能を提供します。