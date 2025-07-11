declare namespace NodeJS {
  type ProcessEnv = {
    readonly CI?: 'true' | 'false' | undefined
    readonly URL?: string | undefined
    readonly DEFAULT_TEST_URL?: string | undefined
  }
}
