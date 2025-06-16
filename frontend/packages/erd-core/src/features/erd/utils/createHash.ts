/**
 * Creates a hash value from a string using a simple hash algorithm.
 * This function generates a compact, deterministic hash that can be used
 * as a key for memoization or caching purposes.
 *
 * @param str - The input string to hash
 * @returns A base-36 encoded hash string
 */
export const createHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    // hash = hash & hash // Convert to 32-bit integer
    hash |= 0
  }
  return hash.toString(36)
}
