/**
 * Format date to "MMM DD, YYYY" format (e.g., "Jan 15, 2025")
 * Uses consistent en-US locale to prevent server/client hydration mismatches
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format date to "M/D/YYYY" format (e.g., "1/15/2025")
 * Uses consistent en-US locale to prevent server/client hydration mismatches
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}
