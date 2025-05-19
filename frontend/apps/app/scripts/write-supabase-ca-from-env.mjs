// This script writes the SUPABASE_CA environment variable (PEM string) to supabase-ca-from-env.crt for use with NODE_EXTRA_CA_CERTS.
// If SUPABASE_CA is not set, the script does nothing and exits successfully (for local/dev environments).
// Usage: Run as a prebuild step before starting/building the app.
// NODE_EXTRA_CA_CERTS should point to the generated supabase-ca-from-env.crt for Node.js SSL trust.

import fs from 'node:fs'
import path from 'node:path'

const ca = process.env.SUPABASE_CA
if (!ca) {
  // No CA provided; skip writing (OK for local/dev)
  process.exit(0)
}

const outPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../supabase-ca-from-env.crt',
)
fs.writeFileSync(outPath, ca, { encoding: 'utf-8' })
console.info(`Wrote CA cert to ${outPath}`)
