import type { Review } from '../../types'

// Document reference structure
export interface DocumentReference {
  path: string
  content: string
  chunks?: string[]
}

// Text segmentation
export function segmentText(text: string, minChunkLength = 80): string[] {
  // Split text by paragraphs or sentences
  const chunks = text
    .split(/(?<=\.|\?|!)\s+|\n\n+/)
    .filter((chunk) => chunk.trim().length >= minChunkLength)

  return chunks
}

// Calculate Jaccard similarity between two texts
export function calculateJaccardSimilarity(
  text1: string,
  text2: string,
): number {
  // Convert to lowercase and split into tokens
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

  // Calculate intersection size
  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)))

  // Calculate union size
  const union = new Set([...tokens1, ...tokens2])

  // Return Jaccard similarity
  return union.size === 0 ? 0 : intersection.size / union.size
}

// Rank document relevance based on query
export function rankDocumentRelevance(
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

// Prepare document references from raw content
export function prepareDocumentReferences(
  rawDocsContent: string,
): DocumentReference[] {
  const docReferences: DocumentReference[] = []

  // Use a simpler regex pattern to capture markdown heading sections
  const matches = rawDocsContent.match(/^# (.+?)$[^#]*/gm)

  if (!matches) {
    return docReferences
  }

  // Process each matched section
  for (const section of matches) {
    // Extract the first line (the heading) and the rest of the content
    const lines = section.split('\n')
    const heading = lines[0]?.replace(/^# /, '').trim() || ''
    const content = lines.slice(1).join('\n').trim()

    if (content) {
      // Split text into chunks
      const chunks = segmentText(content)

      docReferences.push({
        path: heading,
        content,
        chunks,
      })
    }
  }

  return docReferences
}

// Interface for feedback items in the review
export interface FeedbackItem {
  kind: string
  severity: string
  description: string
  suggestion: string
  suggestionSnippets: Array<{
    filename: string
    snippet: string
  }>
}

// Helper functions to reduce complexity in the main citation function
function collectAllDocumentChunks(docReferences: DocumentReference[]): {
  allDocChunks: string[]
  chunkToDocMap: { docIndex: number; chunkIndex: number }[]
} {
  const allDocChunks: string[] = []
  const chunkToDocMap: { docIndex: number; chunkIndex: number }[] = []

  // Collect all document chunks
  for (let docIndex = 0; docIndex < docReferences.length; docIndex++) {
    const doc = docReferences[docIndex]
    if (!doc) continue
    const chunks = doc.chunks

    if (!chunks || chunks.length === 0) continue

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]
      if (typeof chunk !== 'string') continue

      allDocChunks.push(chunk)
      chunkToDocMap.push({ docIndex, chunkIndex })
    }
  }

  return { allDocChunks, chunkToDocMap }
}

function calculateRelevanceScores(
  descriptionChunks: string[],
  allDocChunks: string[],
  chunkToDocMap: { docIndex: number; chunkIndex: number }[],
): Array<{
  docInfo: { docIndex: number; chunkIndex: number }
  relevanceScore: number
}> {
  const matchCandidates: {
    docInfo: { docIndex: number; chunkIndex: number }
    relevanceScore: number
  }[] = []

  for (const chunk of descriptionChunks) {
    if (!chunk) continue

    // Calculate relevance
    const relevanceResults = rankDocumentRelevance(chunk, allDocChunks)

    // Get top results (score > 0.1)
    for (const result of relevanceResults.slice(0, 2)) {
      if (result?.score > 0.1 && result?.index !== undefined) {
        const docMapInfo = chunkToDocMap[result.index]
        if (!docMapInfo) continue

        matchCandidates.push({
          docInfo: docMapInfo,
          relevanceScore: result.score,
        })
      }
    }
  }

  return matchCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

function selectTopMatches(
  matchCandidates: Array<{
    docInfo: { docIndex: number; chunkIndex: number }
    relevanceScore: number
  }>,
  maxMatches = 3,
): Array<{
  docInfo: { docIndex: number; chunkIndex: number }
  relevanceScore: number
}> {
  const usedDocIndices = new Set<number>()
  const selectedMatches: Array<{
    docInfo: { docIndex: number; chunkIndex: number }
    relevanceScore: number
  }> = []

  for (const match of matchCandidates) {
    // Skip already used documents
    if (usedDocIndices.has(match.docInfo.docIndex)) {
      continue
    }

    selectedMatches.push(match)
    usedDocIndices.add(match.docInfo.docIndex)

    if (selectedMatches.length >= maxMatches) break
  }

  return selectedMatches
}

function createFootnotes(
  selectedMatches: Array<{
    docInfo: { docIndex: number; chunkIndex: number }
    relevanceScore: number
  }>,
  docReferences: DocumentReference[],
): string[] {
  const footnotes: string[] = []

  for (let i = 0; i < selectedMatches.length; i++) {
    const match = selectedMatches[i]
    if (!match) continue

    const docIndex = match.docInfo.docIndex
    const chunkIndex = match.docInfo.chunkIndex

    const doc = docReferences[docIndex]
    if (!doc) continue

    const filename = doc.path.split('/').pop() || doc.path
    let chunkContent = ''

    if (doc.chunks?.[chunkIndex]) {
      chunkContent = doc.chunks[chunkIndex] || ''
    }

    // Clean the content without truncating to match test expectations
    const cleanContent = chunkContent
      .replace(/[\r\n]+/g, ' ') // Remove line breaks
      .replace(/\[|\]/g, '\\$&') // Escape square brackets
      .replace(/`/g, "'") // Replace backticks with single quotes
      .trim()

    footnotes.push(`[^${i + 1}]: ${filename} - ${cleanContent}`)
  }

  return footnotes
}

function addFootnoteReferences(
  description: string,
  footnotes: string[],
  selectedMatches: Array<{
    docInfo: { docIndex: number; chunkIndex: number }
    relevanceScore: number
  }>,
): string {
  let updatedDescription = description

  // Add footnote references to the end of paragraphs
  if (footnotes.length > 0) {
    // Create footnote reference markers
    const markers = selectedMatches.map((_, i) => `[^${i + 1}]`).join(' ')

    // Handle single sentence description
    if (!updatedDescription.includes('\n\n')) {
      // Add footnote references to the end of the sentence
      updatedDescription = updatedDescription.replace(
        /([.!?])(\s*)$/,
        `$1 ${markers}$2`,
      )
    } else {
      // Split description into paragraphs
      const paragraphs = updatedDescription.split('\n\n')

      // Add footnote references to the last paragraph
      if (paragraphs.length >= 1) {
        const lastParagraphIndex = paragraphs.length - 1
        const lastParagraph = paragraphs[lastParagraphIndex]

        if (lastParagraph) {
          // Add after the last sentence
          paragraphs[lastParagraphIndex] = lastParagraph.replace(
            /([.!?])(\s*)$/,
            `$1 ${markers}$2`,
          )
        }
      }

      // Rejoin paragraphs
      updatedDescription = paragraphs.join('\n\n')
    }

    // Add footnotes section
    updatedDescription = `${updatedDescription}\n\n${footnotes.join('\n\n')}`
  }

  return updatedDescription
}

// Process Project Rules Consistency feedback item
function processProjectRulesFeedback(
  feedback: Review['feedbacks'][number],
  docReferences: DocumentReference[],
): Review['feedbacks'][number] {
  // Split description into chunks and calculate relevance
  const description = feedback.description
  const descriptionChunks = segmentText(description)

  // Return unchanged if no chunks
  if (!descriptionChunks.length) {
    return feedback
  }

  // Collect all document chunks
  const { allDocChunks, chunkToDocMap } =
    collectAllDocumentChunks(docReferences)

  if (!allDocChunks.length) {
    return feedback
  }

  // Find relevant matches
  const matchCandidates = calculateRelevanceScores(
    descriptionChunks,
    allDocChunks,
    chunkToDocMap,
  )

  // Select top matches
  const selectedMatches = selectTopMatches(matchCandidates)

  // Create footnotes
  const footnotes = createFootnotes(selectedMatches, docReferences)

  // Add footnote references
  const updatedDescription = addFootnoteReferences(
    description,
    footnotes,
    selectedMatches,
  )

  // Return updated description
  return {
    ...feedback,
    description: updatedDescription,
  }
}

// Add citations to feedback
export function addCitationsToFeedback(
  review: Review,
  docReferences: DocumentReference[],
): Review {
  if (!review || !review.feedbacks || !docReferences.length) {
    return review
  }

  // Find Project Rules Consistency feedback items
  const hasProjectRulesFeedbacks = review.feedbacks.some(
    (feedback) => feedback.kind === 'Project Rules Consistency',
  )

  if (!hasProjectRulesFeedbacks) {
    return review
  }

  // Process each feedback item
  const updatedFeedbacks = review.feedbacks.map((feedback) => {
    if (feedback.kind !== 'Project Rules Consistency') {
      return feedback
    }

    return processProjectRulesFeedback(feedback, docReferences)
  })

  // Return updated review
  return {
    ...review,
    feedbacks: updatedFeedbacks,
  }
}
