import { validateConfig } from '@liam-hq/github'

export async function register() {
  if (process.env.VERCEL === '1') {
    const { valid, missing } = validateConfig()
    if (!valid) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      )
    }
  }
}
