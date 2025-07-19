import { describe, expect, it } from 'vitest'
import { ensurePathStructure } from '../utils/pathPreparation'

describe('ensurePathStructure', () => {
  it('should create nested object structure for add operation', () => {
    const target: Record<string, unknown> = { tables: {} }
    const operations = [
      {
        op: 'add' as const,
        path: '/tables/users/columns/id',
        value: { name: 'id', type: 'uuid' },
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      tables: {
        users: {
          columns: {},
        },
      },
    })
  })

  it('should create array structure when path contains numeric index', () => {
    const target: Record<string, unknown> = { tables: {} }
    const operations = [
      {
        op: 'add' as const,
        path: '/tables/posts/columns/0',
        value: { name: 'id' },
      },
      {
        op: 'add' as const,
        path: '/tables/posts/columns/1',
        value: { name: 'title' },
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      tables: {
        posts: {
          columns: [
            {}, // columns[0] created for first operation
            {}, // columns[1] created for second operation
          ],
        },
      },
    })
  })

  it('should handle escaped JSON pointer paths', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      { op: 'add' as const, path: '/foo~1bar/baz~0qux/test', value: 'test' },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    // RFC 6901 compliant: Split first, then unescape each part
    // 'foo~1bar' becomes 'foo/bar' as a single key
    // 'baz~0qux' becomes 'baz~qux' as a single key
    expect(target).toEqual({
      'foo/bar': {
        'baz~qux': {},
      },
    })
  })

  it('should handle multiple operations with add and replace', () => {
    const target: Record<string, unknown> = { users: {} }
    const operations = [
      { op: 'add' as const, path: '/users/alice/profile/name', value: 'Alice' },
      {
        op: 'replace' as const,
        path: '/users/bob/settings/theme',
        value: 'dark',
      },
      { op: 'remove' as const, path: '/users/charlie' }, // Should be ignored
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      users: {
        alice: {
          profile: {},
        },
        bob: {
          settings: {},
        },
      },
    })
  })

  it('should preserve existing structures', () => {
    const target: Record<string, unknown> = {
      tables: {
        users: {
          columns: {
            id: { name: 'id', type: 'uuid' },
          },
        },
      },
    }
    const operations = [
      {
        op: 'add' as const,
        path: '/tables/users/columns/name',
        value: { name: 'name', type: 'string' },
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      tables: {
        users: {
          columns: {
            id: { name: 'id', type: 'uuid' },
          },
        },
      },
    })
  })

  it('should handle empty path parts correctly', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      { op: 'add' as const, path: '//foo//bar//baz', value: 'test' },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      foo: {
        bar: {},
      },
    })
  })

  it('should return error for prototype pollution attempts', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      {
        op: 'add' as const,
        path: '/foo/__proto__/polluted',
        value: 'dangerous',
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isErr()).toBe(true)
    expect(result.isErr() && result.error).toBe(
      'Dangerous path part detected: __proto__',
    )
  })

  it('should return error for constructor pollution attempts', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      {
        op: 'add' as const,
        path: '/foo/constructor/polluted',
        value: 'dangerous',
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isErr()).toBe(true)
    expect(result.isErr() && result.error).toBe(
      'Dangerous path part detected: constructor',
    )
  })

  it('should return error for prototype property pollution attempts', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      {
        op: 'add' as const,
        path: '/foo/prototype/polluted',
        value: 'dangerous',
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isErr()).toBe(true)
    expect(result.isErr() && result.error).toBe(
      'Dangerous path part detected: prototype',
    )
  })

  it('should handle root level operations', () => {
    const target: Record<string, unknown> = {}
    const operations = [{ op: 'add' as const, path: '/name', value: 'test' }]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({}) // ensurePathStructure only creates parent paths, not the final path
  })

  it('should handle complex nested structures with mixed arrays and objects', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      {
        op: 'add' as const,
        path: '/data/items/0/properties/name',
        value: 'Item 1',
      },
      { op: 'add' as const, path: '/data/metadata/count', value: 2 },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    // Now correctly handles array traversal
    expect(target).toEqual({
      data: {
        items: [
          {
            properties: {},
          },
        ],
        metadata: {},
      },
    })
  })

  it('should only process add and replace operations', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      { op: 'add' as const, path: '/added', value: 'yes' },
      { op: 'replace' as const, path: '/replaced', value: 'yes' },
      { op: 'remove' as const, path: '/removed' },
      { op: 'move' as const, path: '/moved', from: '/source' },
      { op: 'copy' as const, path: '/copied', from: '/source' },
      { op: 'test' as const, path: '/tested', value: 'test' },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({}) // Only structures for add/replace are created (but not the final keys)
  })

  it('should handle deep array nesting', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      {
        op: 'add' as const,
        path: '/matrix/0/1/data',
        value: 'test',
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      matrix: [
        {
          '1': {}, // matrix[0][1] is created as parent structure for 'data' key
        },
      ],
    })
  })

  it('should handle multiple array indices at same level', () => {
    const target: Record<string, unknown> = {}
    const operations = [
      {
        op: 'add' as const,
        path: '/items/0/name',
        value: 'First',
      },
      {
        op: 'add' as const,
        path: '/items/2/name',
        value: 'Third',
      },
    ]

    const result = ensurePathStructure(target, operations)
    expect(result.isOk()).toBe(true)

    expect(target).toEqual({
      items: [
        {}, // items[0]
        {}, // items[1] - filled automatically
        {}, // items[2]
      ],
    })
  })
})
