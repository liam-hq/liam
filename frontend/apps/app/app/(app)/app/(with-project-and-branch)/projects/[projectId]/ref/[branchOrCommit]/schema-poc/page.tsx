'use client'

import { Button } from '@/components'
import { SchemaChat } from '@/features/schemas/components/SchemaChat/SchemaChat'
import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import { OverrideEditor } from '@/features/schemas/pages/SchemaPage/components/OverrideEditor/OverrideEditor'
import { SchemaHeader } from '@/features/schemas/pages/SchemaPage/components/SchemaHeader'
import type { Schema, TableGroup } from '@liam-hq/db-structure'
import { overrideSchema, schemaOverrideSchema } from '@liam-hq/db-structure'
import { TabsContent, TabsRoot } from '@liam-hq/ui'
import { useCallback, useEffect, useState } from 'react'
import { safeParse } from 'valibot'
import { parse as parseYaml } from 'yaml'
import { DEFAULT_SCHEMA_TAB, SCHEMA_TAB } from './constants'
import styles from './page.module.css'

// デフォルトのYAMLテンプレート
const defaultOverrideYaml = `overrides:
  tables: {}
  tableGroups: {}
  operations:
    - type: addTable
      table:
        name: "new_table"
        comment: "新しいテーブル"
        columns:
          id:
            name: id
            type: uuid
            default: null
            check: null
            primary: true
            unique: true
            notNull: true
            comment: 'Primary key'
        indexes: {}
        constraints: {}
`

export default function Page() {
  // 初期スキーマ定義（最低限テーブルが1つあるスキーマ）
  const initialSchema: Schema = {
    tables: {
      initial_table: {
        name: 'initial_table',
        comment: 'Initial table for testing',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            default: null,
            check: null,
            primary: true,
            unique: true,
            notNull: true,
            comment: 'Primary key',
          },
        },
        indexes: {},
        constraints: {},
      },
    },
    relationships: {},
    tableGroups: {},
  }

  // 元のスキーマ（ChatInputで編集される）
  const [baseSchema, setBaseSchema] = useState<Schema>(initialSchema)
  // オーバーライド定義（YAMLで編集される）
  const [overrideYaml, setOverrideYaml] = useState<string | undefined>(
    defaultOverrideYaml,
  )
  // オーバーライドが適用された結果のスキーマ
  const [resultSchema, setResultSchema] = useState<Schema>(initialSchema)
  // テーブルグループ情報
  const [tableGroups, setTableGroups] = useState<Record<string, TableGroup>>({})
  // エラー情報
  const [overrideError, setOverrideError] = useState<string | null>(null)

  /**
   * スキーマオーバーライド処理関数
   * YAMLを解析し、バリデーションした上でオーバーライドを適用します
   */
  const applySchemaOverride = useCallback(
    (baseSchema: Schema, yamlContent: string | undefined) => {
      if (!yamlContent || !yamlContent.trim()) {
        return {
          success: true,
          schema: baseSchema,
          tableGroups: {},
          error: null,
        }
      }

      try {
        // YAMLをパース
        const parsedYaml = parseYaml(yamlContent)

        // YAMLの基本構造を確認
        if (!parsedYaml || typeof parsedYaml !== 'object') {
          return {
            success: false,
            schema: baseSchema,
            tableGroups: {},
            error: 'YAMLが有効なオブジェクトではありません',
          }
        }

        // overrides キーが存在することを確認
        if (!parsedYaml.overrides) {
          return {
            success: false,
            schema: baseSchema,
            tableGroups: {},
            error: '有効なオーバーライド定義には "overrides" キーが必要です',
          }
        }

        // スキーマオーバーライド定義として検証
        const parsedOverrideContent = safeParse(
          schemaOverrideSchema,
          parsedYaml,
        )

        if (!parsedOverrideContent.success) {
          const issueMessages = parsedOverrideContent.issues
            .map((i) => {
              return `"${i.path?.join('.')}" で ${i.message}`
            })
            .join('\n')

          return {
            success: false,
            schema: baseSchema,
            tableGroups: {},
            error: `バリデーションエラー:\n${issueMessages}`,
          }
        }

        const overrideResult = overrideSchema(
          baseSchema,
          parsedOverrideContent.output,
        )

        const { schema: updatedSchema, tableGroups } = overrideResult

        return {
          success: true,
          schema: updatedSchema,
          tableGroups,
          error: null,
        }
      } catch (error) {
        console.error('Schema override application failed:', error)
        return {
          success: false,
          schema: baseSchema,
          tableGroups: {},
          error: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        }
      }
    },
    [],
  )

  // オーバーライドYAMLの変更を検知して自動適用
  useEffect(() => {
    const result = applySchemaOverride(baseSchema, overrideYaml)
    if (result.success) {
      setResultSchema(result.schema)
      setTableGroups(result.tableGroups)
    }
    setOverrideError(result.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideYaml, baseSchema, applySchemaOverride])

  // ChatからのスキーマモディファイアはbaseSchemaを更新
  const handleModifySchema = (newSchema: Schema) => {
    // 深いコピーを作成して元のスキーマを変更しないようにする
    setBaseSchema(JSON.parse(JSON.stringify(newSchema)) as Schema)
  }
  return (
    <TabsRoot defaultValue={DEFAULT_SCHEMA_TAB} className={styles.container}>
      <SchemaHeader />
      <TabsContent value={SCHEMA_TAB.ERD} className={styles.tabsContent}>
        <div className={styles.erdContainer}>
          <div className={styles.chatPanel}>
            <SchemaChat
              schema={baseSchema}
              onSchemaChange={handleModifySchema}
              overrideYaml={overrideYaml}
              onOverrideChange={setOverrideYaml}
            />
          </div>
          <div className={styles.editorPanel}>
            <div className={styles.toolbarContainer}>
              {/* デバッグ用スキーマ情報ボタン */}
              <Button
                variant="outline-secondary"
                onClick={() => {
                  alert(
                    `Schema tables count: ${Object.keys(resultSchema.tables).length}`,
                  )
                }}
              >
                Debug Schema Info
              </Button>
            </div>
            <ERDEditor
              schema={resultSchema}
              tableGroups={tableGroups}
              errorObjects={undefined}
              defaultSidebarOpen={false}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value={SCHEMA_TAB.EDITOR} className={styles.tabsContent}>
        <div className={styles.overrideEditorContainer}>
          {overrideError && (
            <div className={styles.errorMessage}>
              <div className={styles.errorTitle}>オーバーライドエラー</div>
              <div className={styles.errorContent}>{overrideError}</div>
            </div>
          )}
          <div className={styles.editorWrapper}>
            <OverrideEditor doc={overrideYaml} setDoc={setOverrideYaml} />
          </div>
        </div>
      </TabsContent>
    </TabsRoot>
  )
}
