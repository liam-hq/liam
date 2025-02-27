import type {
  Column,
  DBStructure,
  Relationships,
  Table,
} from '@liam-hq/db-structure'

/**
 * BEFORE_DB と AFTER_DB をマージして、差分のビジュアライズに使用できるマージ済みDB構造を生成する関数
 *
 * @param before - マイグレーション前のDB構造
 * @param after  - マイグレーション後のDB構造
 * @returns      - マージ済みのDB構造（各テーブルは AFTER_DB をベースに、削除されたカラム・テーブルは removed プロパティにて表現）
 */
export function mergeDbStructures(
  before: DBStructure,
  after: DBStructure,
): DBStructure {
  const mergedTables: Record<string, Table> = {}

  // すべてのテーブル名（BEFORE と AFTER の和集合）を取得
  const allTableNames = new Set<string>([
    ...Object.keys(before.tables),
    ...Object.keys(after.tables),
  ])

  // biome-ignore lint/complexity/noForEach: <explanation>
  allTableNames.forEach((tableName) => {
    const beforeTable = before.tables[tableName]
    const afterTable = after.tables[tableName]

    if (afterTable) {
      // AFTER_DB に存在するテーブルをベースとする
      const mergedTable: Table = { ...afterTable }

      if (beforeTable) {
        // BEFORE_DB にあって AFTER_DB になくなったカラムを検出
        const removedColumns: Record<string, Column> = {}
        for (const colName in beforeTable.columns) {
          if (!(colName in afterTable.columns)) {
            removedColumns[colName] = beforeTable.columns[colName]
          }
        }
        mergedTable.columns = {
          ...(mergedTable.columns || {}),
          ...removedColumns,
        }
      }
      // AFTER_DB にのみ存在する場合はそのまま（新規追加）
      mergedTables[tableName] = mergedTable
    }
  })

  // リレーションのマージ（BEFORE と AFTER の和集合）
  const mergedRelationships: Relationships = {}
  const allRelationshipNames = new Set<string>([
    ...Object.keys(before.relationships),
    ...Object.keys(after.relationships),
  ])
  // biome-ignore lint/complexity/noForEach: <explanation>
  allRelationshipNames.forEach((relName) => {
    const afterRel = after.relationships[relName]
    if (afterRel) {
      mergedRelationships[relName] = { ...afterRel }
    }
  })

  return {
    tables: mergedTables,
    relationships: mergedRelationships,
  }
}
