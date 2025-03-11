export const githubConfig = {
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
}

// Cache the validation result at the module level
const validateConfigOnce = (): { valid: boolean; missing: string[] } => {
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

// Store the validation result when the module is first loaded
export const configValidationResult = validateConfigOnce()

// Keep the original function for explicit validation if needed
export const validateConfig = (): { valid: boolean; missing: string[] } => {
  return configValidationResult
}

export const supportedEvents = [
  'pull_request.opened',
  'pull_request.synchronize',
  'pull_request.reopened',
]
