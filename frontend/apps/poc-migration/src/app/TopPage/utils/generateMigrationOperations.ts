import type { Column, DBStructure, Table } from '@liam-hq/db-structure'
// 型定義（必要に応じて拡張してください）
export type MigrationOperation =
  | { type: 'table-add'; table: Table }
  | { type: 'table-remove'; tableName: string }
  | {
      type: 'column-rename'
      tableName: string
      oldName: string
      newName: string
    }
  | { type: 'column-add'; tableName: string; column: Column }
  | { type: 'column-remove'; tableName: string; columnName: string }

// カラムの主要プロパティ（名前以外）の一致を確認するヘルパー関数
function areColumnsSimilar(oldCol: Column, newCol: Column): boolean {
  return (
    oldCol.type === newCol.type &&
    oldCol.default === newCol.default &&
    oldCol.check === newCol.check &&
    oldCol.primary === newCol.primary &&
    oldCol.unique === newCol.unique &&
    oldCol.notNull === newCol.notNull &&
    oldCol.comment === newCol.comment
  )
}

/**
 * 旧バージョン (oldDb) と新バージョン (newDb) の DBStructure を比較し、
 * テーブル・カラムの追加、削除、リネームなどの操作リストを生成する関数
 */
export function generateMigrationOperations(
  oldDb: DBStructure,
  newDb: DBStructure,
): MigrationOperation[] {
  const operations: MigrationOperation[] = []

  // 新バージョンの各テーブルについて
  for (const tableName in newDb.tables) {
    const newTable = newDb.tables[tableName]
    const oldTable = oldDb.tables[tableName]

    if (!oldTable) {
      // 旧バージョンに存在しないテーブルは新規追加
      operations.push({ type: 'table-add', table: newTable })
      continue // 新規テーブル内のカラムは全て追加扱いなので、ここでは詳細比較不要
    }

    // 共通テーブルの場合、カラムの差分をチェック
    const unmatchedOldColumns: Record<string, Column> = { ...oldTable.columns }

    for (const newColName in newTable.columns) {
      const newCol = newTable.columns[newColName]

      if (oldTable.columns[newColName]) {
        // 同名のカラムが存在する場合は変更なしとみなし、後で削除対象かチェック
        delete unmatchedOldColumns[newColName]
      } else {
        // 新しいカラム名で、旧カラムの中から類似のものがあればリネームと判断
        let detectedRename = false
        for (const oldColName in unmatchedOldColumns) {
          const oldCol = unmatchedOldColumns[oldColName]
          if (areColumnsSimilar(oldCol, newCol)) {
            operations.push({
              type: 'column-rename',
              tableName,
              oldName: oldColName,
              newName: newColName,
            })
            delete unmatchedOldColumns[oldColName]
            detectedRename = true
            break
          }
        }
        if (!detectedRename) {
          // 類似する旧カラムがなければ新規追加と判断
          operations.push({
            type: 'column-add',
            tableName,
            column: newCol,
          })
        }
      }
    }

    // 旧テーブルにあって新テーブルに存在しないカラムは削除されたものと判断
    for (const removedColName in unmatchedOldColumns) {
      operations.push({
        type: 'column-remove',
        tableName,
        columnName: removedColName,
      })
    }
  }

  // 旧バージョンに存在して新バージョンに存在しないテーブルは削除されたものと判断
  for (const tableName in oldDb.tables) {
    if (!(tableName in newDb.tables)) {
      operations.push({ type: 'table-remove', tableName })
    }
  }

  return operations
}
