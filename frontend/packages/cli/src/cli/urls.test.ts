import { describe, expect, it } from 'vitest'
import {
  DbOrmDiscussionUrl,
  DiscussionUrl,
  DocsUrl,
  RepositoryUrl,
  TroubleshootingUrl,
} from './urls.js'

describe('URLs', () => {
  it('should export correct documentation URL', () => {
    expect(DocsUrl).toBe('https://liambx.com/docs')
  })

  it('should export correct troubleshooting URL', () => {
    expect(TroubleshootingUrl).toBe('https://liambx.com/docs/parser/troubleshooting')
  })

  it('should export correct repository URL', () => {
    expect(RepositoryUrl).toBe('https://github.com/liam-hq/liam')
  })

  it('should export correct discussion URL', () => {
    expect(DiscussionUrl).toBe('https://github.com/liam-hq/liam/discussions')
  })

  it('should export correct DB ORM discussion URL', () => {
    expect(DbOrmDiscussionUrl).toBe('https://github.com/liam-hq/liam/discussions/364')
  })
})
