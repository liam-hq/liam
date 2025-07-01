import { describe, expect, it, vi } from 'vitest'
import { nameSimilarity } from '../../nameSimilarity/nameSimilarity'
import { wordOverlapMatch } from '../../wordOverlapMatch/wordOverlapMatch'
import { createTableMapping } from './createTableMapping'

vi.mock('../../nameSimilarity/nameSimilarity')
vi.mock('../../wordOverlapMatch/wordOverlapMatch')

describe('createTableMapping', () => {
  it('should create table mapping for matching table names', async () => {
    const referenceTableNames = ['users', 'orders']
    const predictedTableNames = ['users', 'orders']
    const expectedMapping = { users: 'users', orders: 'orders' }

    // Mock the functions to modify the mapping object
    vi.mocked(nameSimilarity).mockImplementation(
      async (_ref, _pred, mapping) => {
        mapping['users'] = 'users'
        mapping['orders'] = 'orders'
      },
    )
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})

    const result = await createTableMapping(
      referenceTableNames,
      predictedTableNames,
    )

    expect(nameSimilarity).toHaveBeenCalledWith(
      ['users', 'orders'],
      ['users', 'orders'],
      expect.any(Object),
    )
    expect(wordOverlapMatch).toHaveBeenCalledWith(
      ['users', 'orders'],
      ['users', 'orders'],
      expect.any(Object),
    )
    expect(result).toEqual(expectedMapping)
  })

  it('should handle empty reference table names', async () => {
    const referenceTableNames: string[] = []
    const predictedTableNames = ['users']
    const expectedMapping = {}

    vi.mocked(nameSimilarity).mockImplementation(async () => {})
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})

    const result = await createTableMapping(
      referenceTableNames,
      predictedTableNames,
    )

    expect(nameSimilarity).toHaveBeenCalledWith(
      [],
      ['users'],
      expect.any(Object),
    )
    expect(wordOverlapMatch).toHaveBeenCalledWith(
      [],
      ['users'],
      expect.any(Object),
    )
    expect(result).toEqual(expectedMapping)
  })

  it('should handle empty predicted table names', async () => {
    const referenceTableNames = ['users']
    const predictedTableNames: string[] = []
    const expectedMapping = {}

    vi.mocked(nameSimilarity).mockImplementation(async () => {})
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})

    const result = await createTableMapping(
      referenceTableNames,
      predictedTableNames,
    )

    expect(nameSimilarity).toHaveBeenCalledWith(
      ['users'],
      [],
      expect.any(Object),
    )
    expect(wordOverlapMatch).toHaveBeenCalledWith(
      ['users'],
      [],
      expect.any(Object),
    )
    expect(result).toEqual(expectedMapping)
  })

  it('should handle partial matches', async () => {
    const referenceTableNames = ['users', 'orders']
    const predictedTableNames = ['users', 'products']
    const expectedMapping = { users: 'users' }

    vi.mocked(nameSimilarity).mockImplementation(
      async (_ref, _pred, mapping) => {
        mapping['users'] = 'users'
      },
    )
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})

    const result = await createTableMapping(
      referenceTableNames,
      predictedTableNames,
    )

    expect(nameSimilarity).toHaveBeenCalledWith(
      ['users', 'orders'],
      ['users', 'products'],
      expect.any(Object),
    )
    expect(wordOverlapMatch).toHaveBeenCalledWith(
      ['users', 'orders'],
      ['users', 'products'],
      expect.any(Object),
    )
    expect(result).toEqual(expectedMapping)
  })
})
