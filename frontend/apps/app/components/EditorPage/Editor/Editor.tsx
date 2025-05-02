'use client'

import type { SchemaData } from '@/app/api/chat/route'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import type { Schema, TableGroup } from '@liam-hq/db-structure'
import { FileDiff, MessageCircle, Table2 } from 'lucide-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { Chat } from '../Chat'
import { CommandPaletteModal } from '../CommandPaletteModal'
import { FileChanges } from '../FileChanges'
import { Preview, type TabItem } from '../Preview'
import { Tables } from '../Tables'
import styles from './Editor.module.css'

type Props = {
  schema: Schema
  tableGroups: Record<string, TableGroup> | undefined
  adaptedSchema: SchemaData
}

export const Editor: FC<Props> = ({ schema, tableGroups, adaptedSchema }) => {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState<TabItem[]>([])
  const [activePreviewTab, setActivePreviewTab] = useState<string | undefined>()

  const handleClickShowERD = useCallback(() => {
    setCommandMenuOpen(false)
    setPreviewItems((prev) => {
      // すでにERDタイプのアイテムが存在するかチェック
      const exists = prev.some((item) => item.trigger.type === 'ERD')

      // すでに存在する場合は、配列をそのまま返す
      if (exists) {
        // 既存のER Diagramタブをアクティブにする
        const erdItem = prev.find((item) => item.trigger.type === 'ERD')
        if (erdItem) {
          setActivePreviewTab(erdItem.trigger.label)
        }
        return prev
      }

      // 存在しない場合は新しいアイテムを追加
      const newItem: TabItem = {
        trigger: {
          type: 'ERD',
          label: 'ER Diagram',
        },
        content: (
          <ERDEditor
            schema={schema}
            tableGroups={tableGroups}
            errorObjects={[]}
            defaultSidebarOpen={false}
          />
        ),
      }

      // 新しく追加したタブをアクティブにする
      setActivePreviewTab(newItem.trigger.label)

      return [...prev, newItem]
    })
  }, [schema, tableGroups])

  const handleSelectTable = useCallback(
    (tableId: string) => {
      const tableInfo = schema.tables[tableId]

      if (!tableInfo) {
        return
      }

      setPreviewItems((prev) => {
        // 同じtableIdを持つアイテムがすでに存在するかチェック
        const exists = prev.some(
          (item) =>
            item.trigger.type === 'TABLE' && item.trigger.label === tableId,
        )

        // すでに存在する場合は、配列をそのまま返す
        if (exists) {
          // 既存のテーブルタブをアクティブにする
          setActivePreviewTab(tableId)
          return prev
        }

        // 存在しない場合は新しいアイテムを追加
        const newItem: TabItem = {
          trigger: {
            type: 'TABLE',
            label: tableId,
          },
          content: (
            <div className={styles.tableInfo}>
              <h2 className={styles.tableName}>{tableInfo.name}</h2>
              {tableInfo.comment && (
                <p className={styles.tableComment}>{tableInfo.comment}</p>
              )}

              <h3 className={styles.sectionTitle}>カラム</h3>
              <div className={styles.columnsContainer}>
                {Object.entries(tableInfo.columns).map(
                  ([columnName, column]) => (
                    <div key={columnName} className={styles.columnItem}>
                      <div className={styles.columnName}>
                        {columnName} {column.primary && '(PK)'}{' '}
                        {column.unique && '(UQ)'}
                      </div>
                      <div className={styles.columnType}>{column.type}</div>
                      {column.comment && (
                        <div className={styles.columnComment}>
                          {column.comment}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>

              {Object.keys(tableInfo.indexes).length > 0 && (
                <>
                  <h3 className={styles.sectionTitle}>インデックス</h3>
                  <div className={styles.indexesContainer}>
                    {Object.entries(tableInfo.indexes).map(
                      ([indexName, index]) => (
                        <div key={indexName} className={styles.indexItem}>
                          <div className={styles.indexName}>
                            {indexName} {index.unique && '(UQ)'}
                          </div>
                          <div className={styles.indexColumns}>
                            {index.columns.join(', ')}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}

              {Object.keys(tableInfo.constraints).length > 0 && (
                <>
                  <h3 className={styles.sectionTitle}>制約</h3>
                  <div className={styles.constraintsContainer}>
                    {Object.entries(tableInfo.constraints).map(
                      ([constraintName, constraint]) => (
                        <div
                          key={constraintName}
                          className={styles.constraintItem}
                        >
                          <div className={styles.constraintName}>
                            {constraintName}
                          </div>
                          <div className={styles.constraintType}>
                            {constraint.type}
                          </div>
                          {constraint.type === 'FOREIGN KEY' && (
                            <div className={styles.constraintDetail}>
                              {constraint.columnName} →{' '}
                              {constraint.targetTableName}.
                              {constraint.targetColumnName}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          ),
        }

        // 新しく追加したタブをアクティブにする
        setActivePreviewTab(tableId)

        return [...prev, newItem]
      })
    },
    [schema.tables],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        setCommandMenuOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <div className={styles.wrapper}>
        <TabsRoot defaultValue="tables" className={styles.tabsRoot}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="tables" className={styles.tabsTrigger}>
              <Table2 className={styles.icon} />
            </TabsTrigger>
            <TabsTrigger value="fileChanges" className={styles.tabsTrigger}>
              <div className={styles.diffButtonWrapper}>
                <FileDiff className={styles.icon} />
                <span className={styles.diffCount}>2</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="chat" className={styles.tabsTrigger}>
              <MessageCircle className={styles.icon} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tables" className={styles.tabsContent}>
            <Tables
              schema={schema}
              tableGroups={tableGroups}
              onTableSelect={handleSelectTable}
            />
          </TabsContent>
          <TabsContent value="fileChanges" className={styles.tabsContent}>
            <FileChanges />
          </TabsContent>
          <TabsContent value="chat" className={styles.tabsContent}>
            <Chat schemaData={adaptedSchema} tableGroups={tableGroups} />
          </TabsContent>
        </TabsRoot>
        <Preview
          items={previewItems}
          value={activePreviewTab}
          onValueChange={setActivePreviewTab}
        />
      </div>
      <CommandPaletteModal
        open={commandMenuOpen}
        onOpenChange={setCommandMenuOpen}
        onShowERDClick={handleClickShowERD}
      />
    </>
  )
}
