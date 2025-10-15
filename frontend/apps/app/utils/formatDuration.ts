/**
 * Format duration in milliseconds to human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "2m 35s" or "5s"
 *
 * Examples:
 * - 5000 => "5s"
 * - 65000 => "1m 5s"
 * - 150000 => "2m 30s"
 * - 3600000 => "60m 0s"
 */
export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}
