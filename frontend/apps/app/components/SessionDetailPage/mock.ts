import type { ReviewComment } from './types'

export const SCHEMA_UPDATES_REVIEW_COMMENTS: ReviewComment[] = [
  {
    fromLine: 8,
    toLine: 9,
    severity: 'High' as const,
    message:
      'Changing foreign key constraints may affect existing data. Please execute migrations carefully in production environments.',
  },
  {
    fromLine: 24,
    toLine: 26,
    severity: 'Medium' as const,
    message:
      'CHECK constraints prevent invalid data insertion, but we recommend implementing similar validation on the application side as well.',
  },
  {
    fromLine: 39,
    toLine: 42,
    severity: 'Low' as const,
    message:
      'Indexes are properly configured. Task search performance will be improved.',
  },
  {
    fromLine: 15,
    toLine: 15,
    severity: 'Medium' as const,
    message:
      'When assignee_id is NULL, it will be treated as an unassigned task. Please confirm this specification matches your business requirements.',
  },
]
