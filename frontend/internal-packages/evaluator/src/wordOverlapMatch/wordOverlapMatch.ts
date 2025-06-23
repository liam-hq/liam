/**
 * Word Overlap Matching Script
 *
 * This script performs lexical similarity matching between reference and candidate names
 * based on word overlap and string similarity. It uses multiple techniques:
 * - Word tokenization and stop word removal
 * - Exact word overlap detection between tokenized names
 * - Longest Common Substring (LCS) calculation for character-level similarity
 *
 * The script is designed to find matches between names that share common words or
 * have high character-level similarity, making it effective for matching variations
 * of the same concept (e.g., "user_profile" vs "UserProfile" or "customer_data" vs "customer_info").
 */
type Mapping = Record<string, string>

/**
 * Simple stop words list
 */
const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'record'])

/**
 * Convert string to word set: tokenize, lowercase, and remove stop words
 */
function toWordSet(str: string): Set<string> {
  return new Set(
    str
      .toLowerCase()
      .split(/[^a-zA-Z0-9]+/)
      .map((w) => w.trim())
      .filter((w) => w && !STOP_WORDS.has(w)),
  )
}

/**
 * Returns the length of the Longest Common Substring (LCS)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: now poc
function lcString(s1: string, s2: string): number {
  const len1 = s1.length
  const len2 = s2.length
  let maxLen = 0
  const dp: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0))
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        const x = dp[i - 1]
        if (!x) continue
        const y = x[j - 1]
        if (!y) continue
        const a = dp[i]
        if (a?.[j]) {
          a[j] = y + 1
          maxLen = Math.max(maxLen, y + 1)
        }
      }
    }
  }
  return maxLen
}

/**
 * sent_overlap: returns true if two schema names are "sufficiently similar"
 */
function wordOverlap(sent1: string, sent2: string, threshold = 0.75): boolean {
  const wordSet1 = toWordSet(sent1)
  const wordSet2 = toWordSet(sent2)
  if ([...wordSet1].filter((w) => wordSet2.has(w)).length > 0) {
    return true
  }
  // Strict judgment using LCS (currently rarely used, but implementation remains)
  let maxScore = -1
  for (const w1 of wordSet1) {
    for (const w2 of wordSet2) {
      if (w1 === w2) continue
      const lcs = lcString(w1, w2)
      const score = lcs / Math.min(w1.length, w2.length)
      if (score > maxScore) maxScore = score
    }
  }
  return maxScore > threshold
}

/**
 * wordOverlapMatch: adds likely matches from Reference to Predict in the mapping
 */
export function wordOverlapMatch(
  references: string[],
  candidates: string[],
  mapping: Mapping,
): void {
  for (const referenceName of references) {
    if (!(referenceName in mapping)) {
      for (const predictName of candidates) {
        if (!Object.values(mapping).includes(predictName)) {
          if (
            wordOverlap(
              referenceName.toLowerCase(),
              predictName.toLowerCase(),
              0.75,
            )
          ) {
            mapping[referenceName] = predictName
            break
          }
        }
      }
    }
  }
}
