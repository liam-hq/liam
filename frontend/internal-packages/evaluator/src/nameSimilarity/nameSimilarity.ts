import {
  type FeatureExtractionPipeline,
  pipeline,
} from '@huggingface/transformers'

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((sum, a, i) => (vecB[i] ? sum + a * vecB[i] : sum), 0)
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dot / (normA * normB)
}

async function generateEmbeddings(
  texts: string[],
  extractor: FeatureExtractionPipeline,
): Promise<number[][]> {
  return Promise.all(
    texts.map(async (text) => {
      const result = await extractor(text)
      return Array.from(result.data)
    }),
  )
}

function findBestMatch(
  refEmbed: number[],
  candidates: string[],
  candEmbeds: number[][],
  mapping: Record<string, string>,
  threshold: number,
): { bestMatch: string; bestSim: number } {
  let bestMatch = ''
  let bestSim = threshold

  for (let j = 0; j < candidates.length; j++) {
    const predict_name = candidates[j]
    if (!predict_name) continue // Skip empty names
    if (Object.values(mapping).includes(predict_name)) continue

    const candEmbed = candEmbeds[j]
    if (!candEmbed) continue

    const sim = cosineSimilarity(refEmbed, candEmbed)
    if (sim > bestSim) {
      bestMatch = predict_name
      bestSim = sim
    }
  }

  return { bestMatch, bestSim }
}

function shouldSkipReference(
  referenceName: string | undefined,
  mapping: Record<string, string>,
): boolean {
  return !referenceName || mapping[referenceName] !== undefined
}

export async function nameSimilarity(
  references: string[],
  candidates: string[],
  mapping: Record<string, string>,
  threshold = 0.6,
): Promise<void> {
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
  )

  const refEmbeds = await generateEmbeddings(references, extractor)
  const candEmbeds = await generateEmbeddings(candidates, extractor)

  for (let i = 0; i < references.length; i++) {
    const reference_name = references[i]

    if (shouldSkipReference(reference_name, mapping)) continue

    const refEmbed = refEmbeds[i]
    if (!refEmbed) continue

    const { bestMatch } = findBestMatch(
      refEmbed,
      candidates,
      candEmbeds,
      mapping,
      threshold,
    )

    if (bestMatch && reference_name) {
      mapping[reference_name] = bestMatch
    }
  }
}
