import { createClient } from '@/libs/db/server'
import { createOrUpdateFileContent, getFileContent } from '@liam-hq/github'
import { type NextRequest, NextResponse } from 'next/server'

const OVERRIDE_SCHEMA_FILE_PATH = '.liam/schema-meta.json'

export async function POST(request: NextRequest) {
  try {
    const { name, tables, projectId, branchOrCommit } = await request.json()

    if (!name || !tables || !Array.isArray(tables) || tables.length < 2) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      )
    }

    // データベースからプロジェクト情報を取得
    const supabase = await createClient()
    const { data: project } = await supabase
      .from('Project')
      .select(`
        *,
        ProjectRepositoryMapping:ProjectRepositoryMapping(
          *,
          Repository:Repository(
            name, owner, installationId
          )
        )
      `)
      .eq('id', Number(projectId))
      .single()

    const repository = project?.ProjectRepositoryMapping[0].Repository
    if (!repository?.installationId || !repository.owner || !repository.name) {
      return NextResponse.json(
        { error: 'Repository information not found' },
        { status: 404 },
      )
    }

    const repositoryFullName = `${repository.owner}/${repository.name}`

    // 既存のスキーマメタデータを取得
    const { content, sha } = await getFileContent(
      repositoryFullName,
      OVERRIDE_SCHEMA_FILE_PATH,
      branchOrCommit,
      Number(repository.installationId),
    )

    // 新しいグループを追加
    const overrideData = content
      ? JSON.parse(content)
      : { overrides: { tableGroups: {} } }

    if (!overrideData.overrides) {
      overrideData.overrides = {}
    }

    if (!overrideData.overrides.tableGroups) {
      overrideData.overrides.tableGroups = {}
    }

    // グループ名が既に存在する場合は一意の名前を生成
    let uniqueGroupName = name
    let counter = 1
    while (overrideData.overrides.tableGroups[uniqueGroupName]) {
      uniqueGroupName = `${name}_${counter}`
      counter++
    }

    // 新しいグループを追加
    overrideData.overrides.tableGroups[uniqueGroupName] = {
      name: uniqueGroupName,
      tables: tables,
      comment: null,
    }

    // ファイルを更新
    const { success } = await createOrUpdateFileContent(
      repositoryFullName,
      OVERRIDE_SCHEMA_FILE_PATH,
      JSON.stringify(overrideData, null, 2),
      `Add table group: ${uniqueGroupName}`,
      Number(repository.installationId),
      branchOrCommit,
      sha || undefined,
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update schema metadata' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, groupName: uniqueGroupName })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
