import { v4 as uuidv4 } from 'uuid'

import {
  getFileContent,
  getIssueComments,
  getPullRequestDetails,
} from '@liam-hq/github'
import { createClient } from '../libs/supabase'

import { generateReview } from '../prompts/generateReview/generateReview'
import type { GenerateReviewPayload, Review } from '../types'
import { langfuseLangchainHandler } from './langfuseLangchainHandler'

// Document reference structure to track source files for footnotes
interface DocumentReference {
  path: string
  content: string
  chunks?: string[]
}

// 関連性マッチングの結果
interface RelevanceMatch {
  docIndex: number
  chunkIndex: number
  relevanceScore: number
  textPosition: [number, number] // 回答テキスト内の位置 [開始, 終了]
}

// テキストをチャンクに分割する関数
function segmentText(text: string, minChunkLength = 80): string[] {
  // 段落または文で分割
  const chunks = text
    .split(/(?<=\.|\?|!)\s+|\n\n+/)
    .filter((chunk) => chunk.trim().length >= minChunkLength)

  return chunks
}

// Jaccard類似度の計算
function calculateJaccardSimilarity(text1: string, text2: string): number {
  // 小文字に変換し、単語に分割
  const tokens1 = new Set(
    text1
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 0),
  )
  const tokens2 = new Set(
    text2
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 0),
  )

  // 積集合のサイズを計算
  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)))

  // 和集合のサイズを計算
  const union = new Set([...tokens1, ...tokens2])

  // Jaccard類似度を返す
  return union.size === 0 ? 0 : intersection.size / union.size
}

// 関連性スコアに基づくドキュメントのランク付け
function rankDocumentRelevance(
  query: string,
  documents: string[],
): { index: number; score: number }[] {
  return documents
    .map((doc, index) => ({
      index,
      score: calculateJaccardSimilarity(query, doc),
    }))
    .sort((a, b) => b.score - a.score)
}

export const processGenerateReview = async (
  payload: GenerateReviewPayload,
): Promise<{ review: Review; traceId: string }> => {
  try {
    const supabase = createClient()

    // Get repository installationId
    const { data: repository, error: repositoryError } = await supabase
      .from('Repository')
      .select('installationId')
      .eq('id', payload.repositoryId)
      .single()

    if (repositoryError || !repository) {
      throw new Error(
        `Repository with ID ${payload.repositoryId} not found: ${JSON.stringify(repositoryError)}`,
      )
    }

    // Get review-enabled doc paths
    const { data: docPaths, error: docPathsError } = await supabase
      .from('GitHubDocFilePath')
      .select('*')
      .eq('projectId', payload.projectId)
      .eq('isReviewEnabled', true)

    if (docPathsError) {
      throw new Error(
        `Error fetching doc paths: ${JSON.stringify(docPathsError)}`,
      )
    }

    // Fetch content for each doc path and track references for footnotes
    const docReferences: DocumentReference[] = []
    const docsContentArray = await Promise.all(
      docPaths.map(async (docPath: { path: string }) => {
        try {
          const fileData = await getFileContent(
            `${payload.owner}/${payload.name}`,
            docPath.path,
            payload.branchName,
            Number(repository.installationId),
          )

          if (!fileData.content) {
            console.warn(`No content found for ${docPath.path}`)
            return null
          }

          // チャンクに分割して保存
          const chunks = segmentText(fileData.content)

          // Store document reference for footnotes
          docReferences.push({
            path: docPath.path,
            content: fileData.content,
            chunks,
          })

          return `# ${docPath.path}\n\n${fileData.content}`
        } catch (error) {
          console.error(`Error fetching content for ${docPath.path}:`, error)
          return null
        }
      }),
    )

    // Filter out null values and join content
    const docsContent = docsContentArray.filter(Boolean).join('\n\n---\n\n')

    const predefinedRunId = uuidv4()

    // Fetch PR details to get the description
    const prDetails = await getPullRequestDetails(
      Number(repository.installationId),
      payload.owner,
      payload.name,
      payload.pullRequestNumber,
    )

    // Fetch PR comments
    const prComments = await getIssueComments(
      Number(repository.installationId),
      payload.owner,
      payload.name,
      payload.pullRequestNumber,
    )

    // Format PR description
    const prDescription = prDetails.body || 'No description provided.'

    // Format comments for the prompt
    const formattedComments = prComments
      .map(
        (comment) => `${comment.user?.login || 'Anonymous'}: ${comment.body}`,
      )
      .join('\n\n')

    const callbacks = [langfuseLangchainHandler]
    const reviewResult = await generateReview(
      docsContent,
      payload.schemaFile,
      payload.fileChanges,
      prDescription,
      formattedComments,
      callbacks,
      predefinedRunId,
    )

    // Add footnotes to the bodyMarkdown using document references
    const review = {
      ...reviewResult,
      bodyMarkdown: buildReferences(reviewResult.bodyMarkdown, docReferences),
    }

    return { review, traceId: predefinedRunId }
  } catch (error) {
    console.error('Error generating review:', error)
    throw error
  }
}

/**
 * 回答テキストと参照ドキュメントから関連する参照を構築し、脚注として追加する
 */
function buildReferences(
  bodyMarkdown: string,
  docReferences: DocumentReference[],
  maxRef = 6,
): string {
  // 回答テキストをチャンクに分割
  const bodyChunks = segmentText(bodyMarkdown)
  const bodyChunkPositions: [number, number][] = []

  // チャンク位置を計算
  let currentPos = 0
  for (const chunk of bodyChunks) {
    const startPos = bodyMarkdown.indexOf(chunk, currentPos)
    if (startPos !== -1) {
      const endPos = startPos + chunk.length
      bodyChunkPositions.push([startPos, endPos])
      currentPos = endPos
    }
  }

  // ドキュメントの全チャンクを準備
  const allDocChunks: string[] = []
  const chunkToDocMap: { docIndex: number; chunkIndex: number }[] = []

  // 全ドキュメントチャンクを一つの配列に集める
  for (let docIndex = 0; docIndex < docReferences.length; docIndex++) {
    const doc = docReferences[docIndex]
    if (!doc?.chunks || doc.chunks.length === 0) continue

    for (let chunkIndex = 0; chunkIndex < doc.chunks.length; chunkIndex++) {
      const chunk = doc.chunks[chunkIndex]
      if (typeof chunk !== 'string') continue
      allDocChunks.push(chunk)
      chunkToDocMap.push({ docIndex, chunkIndex })
    }
  }

  if (allDocChunks.length === 0) {
    return bodyMarkdown // チャンクがなければ元のテキストを返す
  }

  // 全ての回答チャンクとドキュメントチャンクの関連性を評価
  const allMatches: RelevanceMatch[] = []

  for (let i = 0; i < bodyChunks.length; i++) {
    const bodyChunk = bodyChunks[i]
    const bodyPosition = bodyChunkPositions[i]

    // このチャンクに対する関連度を計算
    const relevanceResults = rankDocumentRelevance(bodyChunk, allDocChunks)

    // 上位の結果を取得
    for (const result of relevanceResults.slice(0, 3)) {
      if (result.score > 0.1) {
        const docMapInfo = chunkToDocMap[result.index]
        if (!docMapInfo) continue

        if (bodyPosition) {
          allMatches.push({
            docIndex: docMapInfo.docIndex,
            chunkIndex: docMapInfo.chunkIndex,
            relevanceScore: result.score,
            textPosition: bodyPosition,
          })
        }
      }
    }
  }

  // 関連性スコアでソート
  allMatches.sort((a, b) => b.relevanceScore - a.relevanceScore)

  // 最も関連性の高いmaxRef個の参照を選択
  const usedDocIndices = new Set<number>()
  const usedBodyPositions = new Set<string>()
  const selectedMatches: RelevanceMatch[] = []

  for (const match of allMatches) {
    if (!match) continue
    // 既に使用されているドキュメント or 位置が近すぎる場合はスキップ
    const positionKey = `${match.textPosition[0]}-${match.textPosition[1]}`
    if (
      usedDocIndices.has(match.docIndex) ||
      usedBodyPositions.has(positionKey)
    ) {
      continue
    }

    selectedMatches.push(match)
    usedDocIndices.add(match.docIndex)
    usedBodyPositions.add(positionKey)

    if (selectedMatches.length >= maxRef) break
  }

  // 位置に基づいてソート
  selectedMatches.sort((a, b) => a.textPosition[0] - b.textPosition[0])

  // 引用マーカーを挿入
  let modifiedBody = bodyMarkdown
  let offset = 0

  for (let i = 0; i < selectedMatches.length; i++) {
    const match = selectedMatches[i]
    const marker = `[^${i + 1}]`

    // マーカーを挿入する位置（チャンクの終了位置）
    const insertPosition = match.textPosition[1] + offset

    // マーカーを挿入
    modifiedBody = `${modifiedBody.substring(0, insertPosition)}${marker}${modifiedBody.substring(insertPosition)}`

    // 後続の挿入位置を調整するためのオフセットを更新
    offset += marker.length
  }

  // 脚注を作成
  const footnotes = selectedMatches.map((match, index) => {
    const doc = docReferences[match.docIndex]
    if (!doc) return `[^${index + 1}]: Unknown reference`

    const filename = doc.path.split('/').pop() || doc.path
    let chunkContent = ''
    if (doc.chunks && doc.chunks[match.chunkIndex]) {
      chunkContent = doc.chunks[match.chunkIndex]
    }

    return `[^${index + 1}]: ${filename} - ${chunkContent?.substring(0, 100) || ''}${chunkContent && chunkContent.length > 100 ? '...' : ''}`
  })

  // 脚注を本文に追加
  if (footnotes.length > 0) {
    return `${modifiedBody}\n\n${footnotes.join('\n\n')}`
  }

  return modifiedBody
}
