/**
 * Utility functions: Mapping between category and kind
 */

// Category type used in the database
type CategoryEnum =
  | 'MIGRATION_SAFETY'
  | 'DATA_INTEGRITY'
  | 'PERFORMANCE_IMPACT'
  | 'PROJECT_RULES_CONSISTENCY'
  | 'SECURITY_OR_SCALABILITY'

// Kind type used in the review schema
type KindEnum =
  | 'Migration Safety'
  | 'Data Integrity'
  | 'Performance Impact'
  | 'Project Rules Consistency'
  | 'Security or Scalability'

/**
 * Converts review schema kind format to database category format
 */
export function kindToCategory(
  kind: KindEnum | string | null | undefined,
): CategoryEnum {
  if (!kind) return 'MIGRATION_SAFETY' // Default value

  const mapping: Record<string, CategoryEnum> = {
    'Migration Safety': 'MIGRATION_SAFETY',
    'Data Integrity': 'DATA_INTEGRITY',
    'Performance Impact': 'PERFORMANCE_IMPACT',
    'Project Rules Consistency': 'PROJECT_RULES_CONSISTENCY',
    'Security or Scalability': 'SECURITY_OR_SCALABILITY',
  }

  return mapping[kind] || 'MIGRATION_SAFETY'
}
