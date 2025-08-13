# Public Share機能 実装計画 v3

## 概要
Design Session（AI会話履歴 + Artifact + ER図）を公開共有できるPublic Share機能の実装計画。

### 戦略的意義
- **プロダクト差別化**: 他のERDツールにはないAIによる設計プロセスの透明性をアピール
- **バイラル成長**: 「こんなプロレベル設計がAIで作れた！」のTwitter/SNS拡散
- **コミュニティ形成**: 設計事例の共有によるユーザーコミュニティ構築

### アーキテクチャ設計
- **テーブル分離アプローチ**: Private/Publicデータを完全分離
- **セキュリティファースト**: デフォルトPrivate、明示的オプトイン
- **UUID識別**: `public_design_sessions.id`(UUID)で公開URL識別
- **Read Only & Immutable**: 公開データは読み取り専用、タイムライン書き込み不可
- **ユーザー責任**: 機密情報チェックは利用者が100%責任を持つ

## Phase 1: データベース基盤整備

### Migration ファイル作成
```bash
pnpm -F db supabase:migration:new create_public_share_tables
```

### テーブル作成

#### 1. public_design_sessions
```sql
CREATE TABLE public_design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_design_session_id UUID NOT NULL REFERENCES design_sessions(id),
  name TEXT NOT NULL,
  created_by_user_name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(original_design_session_id)
);

CREATE INDEX idx_public_design_sessions_original_id ON public_design_sessions(original_design_session_id);
```

#### 2. public_artifacts
```sql
CREATE TABLE public_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_design_session_id UUID NOT NULL REFERENCES public_design_sessions(id) ON DELETE CASCADE,
  artifact JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_artifacts_session_id ON public_artifacts(public_design_session_id);
```

#### 3. public_timeline_items
```sql
CREATE TABLE public_timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_design_session_id UUID NOT NULL REFERENCES public_design_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL, -- 'user', 'assistant', 'schema_version', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_timeline_items_session_id ON public_timeline_items(public_design_session_id);
```

#### 4. public_building_schemas
```sql
CREATE TABLE public_building_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_design_session_id UUID NOT NULL REFERENCES public_design_sessions(id) ON DELETE CASCADE,
  schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_public_building_schemas_session_id ON public_building_schemas(public_design_session_id);
```

#### 5. public_building_schema_versions
```sql
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

### データコピー関数
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


## Phase 2: バックエンド機能実装

### TypeScript型定義更新
```bash
pnpm -F db supabase:gen
```

### ディレクトリ構造
```
frontend/apps/app/
├── services/
│   └── publicShare/
│       ├── createPublicSession.ts
│       ├── getPublicSession.ts
│       └── deletePublicSession.ts
├── app/api/
│   ├── design-sessions/[id]/share/
│   │   └── route.ts
│   └── public/sessions/[id]/
│       └── route.ts
└── components/
    ├── PublicShareDialog/
    │   ├── PublicShareDialog.tsx
    │   ├── PublicShareSuccessDialog.tsx
    │   └── index.ts
    └── hooks/
        └── usePublicShare.ts
```


### Public Session作成サービス
```typescript
// frontend/apps/app/services/publicShare/createPublicSession.ts
import { createClient } from '@/lib/supabase/client'
import { Result, ok, err } from 'neverthrow'

export type CreatePublicSessionResult = {
  publicSessionId: string
  publicUrl: string
}

export const createPublicSession = async (
  designSessionId: string
): Promise<Result<CreatePublicSessionResult, string>> => {
  const supabase = createClient()
  
  // 1. 既存の公開セッションをチェック
  const existingResult = await supabase
    .from('public_design_sessions')
    .select('id')
    .eq('original_design_session_id', designSessionId)
    .single()
  
  if (existingResult.data) {
    return ok({
      publicSessionId: existingResult.data.id,
      publicUrl: `${window.location.origin}/public/sessions/${existingResult.data.id}`
    })
  }
  
  // 2. Public Session作成（データベース関数を使用）
  const copyResult = await supabase.rpc(
    'copy_session_to_public',
    { p_design_session_id: designSessionId }
  )
  
  if (copyResult.error) {
    return err(`Failed to create public session: ${copyResult.error.message}`)
  }
  
  const publicSessionId = copyResult.data as string
  const publicUrl = `${window.location.origin}/public/sessions/${publicSessionId}`
  
  return ok({
    publicSessionId,
    publicUrl
  })
}
```

### API エンドポイント

#### Public Session作成API
```typescript
// frontend/apps/app/app/api/design-sessions/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicSession } from '@/services/publicShare/createPublicSession'

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
  
  const user = authResult.data.user
  
  // セッションの所有権チェック
  const sessionResult = await supabase
    .from('design_sessions')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (sessionResult.error || !sessionResult.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  
  const session = sessionResult.data
  
  // 組織メンバーシップチェック
  const membershipResult = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', session.organization_id)
    .eq('user_id', user.id)
    .single()
  
  if (membershipResult.error || !membershipResult.data) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Public Session作成
  const result = await createPublicSession(params.id)
  
  return result.match(
    (success) => NextResponse.json({
      publicSessionId: success.publicSessionId,
      publicUrl: success.publicUrl
    }),
    (error) => NextResponse.json(
      { error },
      { status: 400 }
    )
  )
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // 認証・権限チェック（上記と同様の処理）
  const authResult = await supabase.auth.getUser()
  if (authResult.error || !authResult.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Public Session削除
  const deleteResult = await supabase
    .from('public_design_sessions')
    .delete()
    .eq('original_design_session_id', params.id)
  
  if (deleteResult.error) {
    return NextResponse.json(
      { error: 'Failed to delete public session' },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ success: true })
}
```

#### Public Session取得API
```typescript
// frontend/apps/app/app/api/public/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // Public Session情報取得
  const sessionResult = await supabase
    .from('public_design_sessions')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (sessionResult.error || !sessionResult.data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
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
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    session,
    artifacts: artifactsResult.data || [],
    timelineItems: timelineResult.data || [],
    schemas: schemasResult.data || []
  })
}
```

## Phase 3: UI/UX実装

### Export Dropdown 拡張
```tsx
// frontend/apps/app/components/SessionDetailPage/components/Output/components/Header/ExportDropdown.tsx
import { Share } from '@liam-hq/ui'

export const ExportDropdown: FC<Props> = ({
  schema,
  artifactDoc,
  cumulativeOperations,
  designSessionId, // 新しいprop
}) => {
  const [isPublicShareDialogOpen, setIsPublicShareDialogOpen] = useState(false)

  return (
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
          
          {/* 新規追加: Public Share */}
          <DropdownMenuItem
            leftIcon={<Share size={16} />}
            onSelect={() => setIsPublicShareDialogOpen(true)}
          >
            Public Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
      
      {/* Public Share Dialog */}
      <PublicShareDialog
        isOpen={isPublicShareDialogOpen}
        onClose={() => setIsPublicShareDialogOpen(false)}
        designSessionId={designSessionId}
      />
    </DropdownMenuRoot>
  )
}
```

### Public Share Dialog
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

### Public Share Success Dialog
```tsx
// frontend/apps/app/components/PublicShareDialog/PublicShareSuccessDialog.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  useToast
} from '@liam-hq/ui'
import { Copy, Twitter, Linkedin, ExternalLink, Check } from '@liam-hq/ui'

type Props = {
  isOpen: boolean
  onClose: () => void
  publicUrl: string
  designSessionName: string
}

export const PublicShareSuccessDialog: FC<Props> = ({
  isOpen,
  onClose,
  publicUrl,
  designSessionName
}) => {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copied!',
        description: 'Public URL copied to clipboard',
        status: 'success'
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy URL to clipboard',
        status: 'error'
      })
    }
  }

  const shareToTwitter = () => {
    const text = `Check out this AI-generated database design: ${designSessionName}`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const openPublicUrl = () => {
    window.open(publicUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎉 Public Share Created!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="public-url">Public URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="public-url"
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share on social media</Label>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                className="flex-1"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToLinkedIn}
                className="flex-1"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </div>

          <Button
            onClick={openPublicUrl}
            className="w-full"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Page
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### usePublicShare Hook
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

### Session List での公開状態表示
```tsx
// 既存のSessionListItem.tsxに追加
import { Globe, Badge } from '@liam-hq/ui'

// SessionListItemコンポーネント内に追加
{session.isPublicShared && (
  <Badge variant="secondary" className="ml-2">
    <Globe className="h-3 w-3 mr-1" />
    Public
  </Badge>
)}
```

## チェックリスト

### Phase 1: データベース基盤整備
- [ ] Migration ファイル作成 (`create_public_share_tables`)
- [ ] `public_design_sessions` テーブル作成
- [ ] `public_artifacts` テーブル作成  
- [ ] `public_timeline_items` テーブル作成
- [ ] `public_building_schemas` テーブル作成
- [ ] `public_building_schema_versions` テーブル作成
- [ ] インデックス作成
- [ ] `copy_session_to_public()` 関数実装
- [ ] Migration実行・確認

### Phase 2: バックエンド機能実装
- [ ] TypeScript型定義更新 (`pnpm -F db supabase:gen`)
- [ ] `services/publicShare/` 実装  
  - [ ] `createPublicSession.ts` - 公開セッション作成
  - [ ] `getPublicSession.ts` - 公開セッション取得
  - [ ] `deletePublicSession.ts` - 公開セッション削除
- [ ] API エンドポイント実装
  - [ ] `POST /api/design-sessions/[id]/share` 
  - [ ] `DELETE /api/design-sessions/[id]/share`
  - [ ] `GET /api/public/sessions/[id]`
- [ ] 単体テスト作成

### Phase 3: UI/UX実装  
- [ ] `ExportDropdown.tsx` に "Public Share" オプション追加
- [ ] `PublicShareDialog/` コンポーネント群実装
  - [ ] `PublicShareDialog.tsx` - メインダイアログ
  - [ ] `PublicShareSuccessDialog.tsx` - 成功ダイアログ
- [ ] `usePublicShare.ts` カスタムフック実装
- [ ] Session一覧に公開ステータスバッジ追加
- [ ] UI/UX テスト
- [ ] アクセシビリティ確認

## 次のPhase
- Phase 4: 公開ページ実装 (`/public/sessions/[id]`)
- Phase 5: SEO・SNS最適化  
- Phase 6: セキュリティ・監視
- Phase 7: テスト・品質保証

## 技術スタック
- **Database**: PostgreSQL (Supabase)
- **Backend**: Next.js App Router, TypeScript
- **Frontend**: React, Valtio, CSS Modules
- **UI Components**: @liam-hq/ui
- **Authentication**: Supabase Auth
