declare namespace NodeJS {
  type ProcessEnv = {
    readonly CI?: 'true' | 'false' | undefined
    readonly URL?: string | undefined
    readonly DEFAULT_TEST_URL?: string | undefined
    readonly VERCEL_PROTECTION_BYPASS_SECRET?: string | undefined
  }
}
