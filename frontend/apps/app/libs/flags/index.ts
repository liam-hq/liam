import { flag } from 'flags/next'

function takeLocalEnv(localEnvironemntKey: string) {
  if (process.env.NODE_ENV !== 'development') {
    return false
  }
  if (
    process.env[localEnvironemntKey] === undefined ||
    process.env[localEnvironemntKey] === 'false'
  ) {
    return false
  }
  return true
}

export const migrationFlag = flag({
  key: 'migration',
  decide() {
    return takeLocalEnv('MIGRATION_ENABLED')
  },
})
