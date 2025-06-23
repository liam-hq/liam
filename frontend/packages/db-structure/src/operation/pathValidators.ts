export const createPathValidator = (pattern: RegExp) => {
  return (input: unknown): boolean => {
    if (typeof input !== 'string') return false
    return pattern.test(input)
  }
}
