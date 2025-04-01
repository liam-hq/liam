import {
  array,
  enum as enumType,
  maxValue,
  minValue,
  number,
  object,
  pipe,
  string,
} from 'valibot'

const KindEnum = enumType({
  'Migration Safety': 'Migration Safety',
  'Data Integrity': 'Data Integrity',
  'Performance Impact': 'Performance Impact',
  'Project Rules Consistency': 'Project Rules Consistency',
  'Security or Scalability': 'Security or Scalability',
})

const SeverityEnum = enumType({
  high: 'high',
  medium: 'medium',
  low: 'low',
})

export const reviewSchema = object({
  bodyMarkdown: string(),
  issues: array(
    object({
      kind: KindEnum,
      severity: SeverityEnum,
      description: string(),
      suggestion: string(),
    }),
  ),
  scores: array(
    object({
      kind: KindEnum,
      value: pipe(number(), minValue(0), maxValue(10)),
      reason: string(),
    }),
  ),
  summary: string(),
})
