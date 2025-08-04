import { createFlagsDiscoveryEndpoint, getProviderData } from 'flags/next'
import * as flags from '@/libs/flags'

// @see: https://vercel.com/docs/feature-flags/implement-flags-in-toolbar
export const GET = createFlagsDiscoveryEndpoint(async () => {
  const providerData = getProviderData(flags)
  return providerData
})
