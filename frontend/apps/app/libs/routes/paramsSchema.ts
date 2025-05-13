import * as v from 'valibot'

const isURLEncoded = v.custom<string>((value) => {
  // Check if the value contains characters that need URL encoding
  const decodedValue = decodeURIComponent(String(value))
  const needsEncoding = /[\s%/\\?#[\]@!$&'()*+,;=]/.test(decodedValue)

  if (needsEncoding) {
    return decodedValue !== String(value)
  }

  return true
}, 'branchOrCommit must be URL encoded if it contains special characters')

const decodeURL = v.transform((value: string) => decodeURIComponent(value))

/**
 * Schema for branchOrCommit parameter
 * Validates URL encoded value and returns the decoded value
 */
export const branchOrCommitSchema = v.pipe(v.string(), isURLEncoded, decodeURL)
