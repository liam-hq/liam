import { array, enum as enumType, strictObject, string } from 'valibot'

const KindEnum = enumType({
  'Migration Safety': 'Migration Safety',
  'Data Integrity': 'Data Integrity',
  'Performance Impact': 'Performance Impact',
  'Project Rules Consistency': 'Project Rules Consistency',
  'Security or Scalability': 'Security or Scalability',
})

export const SeverityEnum = enumType({
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  POSITIVE: 'POSITIVE',
})

export const reviewSchema = strictObject({
  bodyMarkdown: string(),
  feedbacks: array(
    strictObject({
      kind: KindEnum,
      severity: SeverityEnum,
      description: string(),
      suggestion: string(),
      suggestionSnippets: array(
        strictObject({
          filename: string(),
          snippet: string(),
        }),
      ),
    }),
  ),
  scores: array(
    strictObject({
      kind: KindEnum,
      reason: string(),
    }),
  ),
})
