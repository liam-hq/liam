import { describe, expect, it } from 'vitest'
import { nameSimilarity } from './nameSimilarity'

// Increase timeout due to model initialization
const TIMEOUT = 30000

describe('nameSimilarity', () => {
  it(
    'should map identical names correctly',
    async () => {
      const references = ['Database Administrator']
      const candidates = ['Database Administrator']
      const mapping: Record<string, string> = {}

      await nameSimilarity(references, candidates, mapping)

      expect(mapping).toHaveProperty('Database Administrator')
      expect(mapping['Database Administrator']).toBe('Database Administrator')
    },
    TIMEOUT,
  )

  it(
    'should map multiple exact matches correctly',
    async () => {
      const references = ['Policy ID', 'Claim Amount', 'Claim Date']
      const candidates = [
        'ID',
        'Status',
        'Policy ID',
        'Claim Amount',
        'Claim Date',
      ]
      const mapping: Record<string, string> = {}

      await nameSimilarity(references, candidates, mapping)

      expect(mapping).toEqual({
        'Claim Amount': 'Claim Amount',
        'Claim Date': 'Claim Date',
        'Policy ID': 'Policy ID',
      })
    },
    TIMEOUT,
  )

  it(
    'should map similar names when exact matches are not available',
    async () => {
      const references = ['Policy ID', 'Claim Amount', 'Claim Date']
      const candidates = [
        'ID',
        'Status',
        'Policy ID',
        'Claim Amount',
        'Claimed Date',
      ]
      const mapping: Record<string, string> = {}

      await nameSimilarity(references, candidates, mapping)

      expect(mapping).toEqual({
        'Claim Amount': 'Claim Amount',
        'Claim Date': 'Claimed Date',
        'Policy ID': 'Policy ID',
      })
    },
    TIMEOUT,
  )

  it(
    'should exclude low similarity matches when threshold is 0.6',
    async () => {
      const references = ['Policy ID', 'Claim Amount', 'Claim Date']
      const candidates = [
        'ID',
        'Status',
        'Policy ID',
        'Claim Amount',
        'Claimed At',
      ]
      const mapping: Record<string, string> = {}

      await nameSimilarity(references, candidates, mapping, 0.6)

      expect(mapping).toEqual({
        'Claim Amount': 'Claim Amount',
        'Policy ID': 'Policy ID',
      })
    },
    TIMEOUT,
  )

  it(
    'should include more matches when threshold is lowered to 0.3',
    async () => {
      const references = ['Policy ID', 'Claim Amount', 'Claim Date']
      const candidates = [
        'ID',
        'Status',
        'Policy ID',
        'Claim Amount',
        'Claimed At',
      ]
      const mapping: Record<string, string> = {}

      await nameSimilarity(references, candidates, mapping, 0.3)

      expect(mapping).toEqual({
        'Claim Amount': 'Claim Amount',
        'Claim Date': 'Claimed At',
        'Policy ID': 'Policy ID',
      })
    },
    TIMEOUT,
  )
})
