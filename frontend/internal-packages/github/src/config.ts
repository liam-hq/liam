export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const requiredEnvVars = [
    'GITHUB_APP_ID',
    'GITHUB_PRIVATE_KEY',
    'GITHUB_WEBHOOK_SECRET',
  ]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  return {
    valid: missing.length === 0,
    missing,
  }
}

export const supportedEvents = [
  'pull_request.opened',
  'pull_request.synchronize',
  'pull_request.reopened',
]
