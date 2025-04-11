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
  QUESTION: 'QUESTION',
})

const citationSchema = strictObject({
  sourceUrl: string(),
  quote: string(),
})

const contentWithCitationsSchema = strictObject({
  content: string(),
  citations: array(citationSchema),
})

export const reviewSchema = strictObject({
  bodyMarkdown: contentWithCitationsSchema,
  feedbacks: array(
    strictObject({
      kind: KindEnum,
      severity: SeverityEnum,
      description: string(),
      suggestion: contentWithCitationsSchema,
      suggestionSnippets: array(
        strictObject({
          filename: string(),
          snippet: string(),
        }),
      ),
    }),
  ),
})
