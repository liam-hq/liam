export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const requiredEnvVars = ['GITHUB_APP_ID', 'GITHUB_PRIVATE_KEY']

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  return {
    valid: missing.length === 0,
    missing,
  }
}
