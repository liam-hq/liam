import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import { describe, expect, it, type MockedFunction, vi } from 'vitest'
import { UnexpectedTokenWarningError } from '../../errors.js'
import { processSQLInChunks } from './processSqlInChunks.js'

describe(processSQLInChunks, () => {
  describe('processSQLInChunks', () => {
    it('should split input by newline and process each chunk', async () => {
      const input = 'SELECT 1;\nSELECT 2;\nSELECT 3;'
      const chunkSize = 2
      const callback = vi.fn().mockResolvedValue([null, null, []])

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('SELECT 1;\nSELECT 2;', 0)
      expect(callback).toHaveBeenCalledWith('SELECT 3;', 20)
    })

    it('should handle chunks correctly to avoid invalid SQL syntax', async () => {
      const input = 'SELECT 1;\nSELECT 2;\nSELECT 3;\nSELECT 4;'
      const chunkSize = 3
      const callback = vi.fn().mockResolvedValue([null, null, []])

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith(
        'SELECT 1;\nSELECT 2;\nSELECT 3;',
        0,
      )
      expect(callback).toHaveBeenCalledWith('SELECT 4;', 30)
    })

    it('should handle input with no newlines correctly', async () => {
      const input = 'SELECT 1; SELECT 2; SELECT 3;'
      const chunkSize = 1
      const callback = vi.fn().mockResolvedValue([null, null, []])

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('SELECT 1; SELECT 2; SELECT 3;', 0)
    })

    it('should handle empty input correctly', async () => {
      const input = ''
      const chunkSize = 1
      const callback = vi.fn().mockResolvedValue([null, null, []])

      await processSQLInChunks(input, chunkSize, callback)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('processSQLInChunks, partially consuming chunk lines', () => {
    // Helper function to create a mock callback that asserts the query and returns the expected value.
    type SQLCallbackResult = [
      retryOffset: number | null,
      readOffset: number | null,
      errors: UnexpectedTokenWarningError[],
    ]
    const createMockCallback = (
      expectedCalls: [query: string, result: SQLCallbackResult][],
    ): MockedFunction<
      (query: string) => Promise<ResultAsync<SQLCallbackResult, Error>>
    > => {
      const callback = vi.fn().mockImplementation(async (query) => {
        const callIndex = callback.mock.calls.length - 1
        const expectedCall = expectedCalls[callIndex]

        if (!expectedCall) {
          return errAsync(
            new Error(
              `Unexpected callback call at index ${callIndex} with query:\n${query}`,
            ),
          )
        }

        const [expectedQuery, returnValue] = expectedCall
        expect(query).toBe(expectedQuery)
        return okAsync(returnValue)
      })

      return callback
    }

    it('should correctly handle readOffset by partially consuming chunk lines', async () => {
      const input = `SELECT 1;
SELECT 2;
SELECT 3, -- partial statement
4;`
      const chunkSize = 3
      const expectedCalls: [query: string, result: SQLCallbackResult][] = [
        // [query, [retryOffset, readOffset, errors]]

        // 1st: Processes "SELECT 1;", "SELECT 2;", and "SELECT 3,".
        // Since "SELECT 3," is an incomplete statement, the parser returns readOffset at the end of the second statement (position 19).
        [
          'SELECT 1;\nSELECT 2;\nSELECT 3, -- partial statement',
          [null, 19, []],
        ],
        // 2nd: Processes the remaining part starting from "SELECT 3".
        ['SELECT 3, -- partial statement\n4;', [null, null, []]],
      ]

      const callback = createMockCallback(expectedCalls)
      const wrapperCallback = async (
        chunk: string,
      ): Promise<SQLCallbackResult> => {
        const result = await callback(chunk)
        return result.match(
          (value) => value,
          (error) => [
            null,
            null,
            [new UnexpectedTokenWarningError(error.message)],
          ],
        )
      }
      const errors = await processSQLInChunks(input, chunkSize, wrapperCallback)

      expect(errors).toEqual([])
      expect(callback).toHaveBeenCalledTimes(expectedCalls.length)
    })

    it('should correctly calculate chunk offset for CHECK constraint location correction', async () => {
      // Test case specifically for CHECK constraint parsing across chunks
      // This test verifies the fix for chunk offset correction where constraint.location
      // was relative to chunk but needed to be absolute for the full SQL text
      const input = `CREATE TABLE users (id INTEGER);
CREATE TABLE design_sessions (
  id INTEGER,
  project_id INTEGER,
  organization_id INTEGER
);
ALTER TABLE design_sessions ADD CONSTRAINT design_sessions_project_or_org_check 
  CHECK ((project_id IS NOT NULL) OR (organization_id IS NOT NULL));`

      const chunkSize = 4 // Split at strategic points to test chunk offset calculation
      const actualChunkOffsets: number[] = []

      const callback = vi
        .fn()
        .mockImplementation(async (_chunk: string, chunkOffset: number) => {
          actualChunkOffsets.push(chunkOffset)
          return [null, null, []] // Successful processing
        })

      await processSQLInChunks(input, chunkSize, callback)

      // Verify that chunk offsets are calculated correctly
      expect(actualChunkOffsets.length).toBeGreaterThan(1) // Should be split into multiple chunks
      expect(actualChunkOffsets[0]).toBe(0) // First chunk starts at 0

      // Second chunk should start after first chunk + newlines
      // Calculate expected offset manually
      const lines = input.split('\n')
      let expectedSecondOffset = 0
      for (let i = 0; i < chunkSize && i < lines.length; i++) {
        expectedSecondOffset += (lines[i] || '').length + 1 // +1 for newline
      }

      if (actualChunkOffsets.length > 1) {
        expect(actualChunkOffsets[1]).toBe(expectedSecondOffset)
      }
    })

    it('should correctly handle retryOffset by partially consuming chunk lines', async () => {
      // Test case where a statement (a 6-line CREATE TABLE statement) exceeds the chunk size (3 lines).
      //
      // NOTE:
      // This is a real-world scenario inspired by GitLab's `db/structure.sql`.
      // While we set CHUNK_SIZE to 500 in practice, GitLab's `db/structure.sql` contains some
      // `CREATE TABLE` statements that span over 500 lines.
      // Reference:
      // https://gitlab.com/gitlab-org/gitlab-foss/-/blob/b94eb57589bd639078b783c296642e68dfb91780/db/structure.sql#L6897-7506
      //
      // For simplicity, this test uses CHUNK_SIZE = 3 and a CREATE TABLE statement with only 6 lines.
      const input = `SELECT 1;
SELECT 2;
CREATE TABLE t1 (
  c1 int,
  c2 int,
  c3 int,
  c4 int
);`
      const chunkSize = 3
      const error = new UnexpectedTokenWarningError('')
      const expectedCalls: [query: string, result: SQLCallbackResult][] = [
        // [query, [retryOffset, readOffset, errors]]

        // 1st: Reads the first three lines. "CREATE TABLE t1 (" is incomplete, so the parser returns an retryOffset at position 38.
        ['SELECT 1;\nSELECT 2;\nCREATE TABLE t1 (', [38, null, [error]]],
        // 2nd: Retries processing only the first two lines.
        ['SELECT 1;\nSELECT 2;', [null, null, []]],
        // 3rd: Attempts to process lines 3-5, hitting the same issue.
        ['CREATE TABLE t1 (\n  c1 int,\n  c2 int,', [38, null, [error]]],
        // 4th: Shrinking mode: Attempts with lines 3-4.
        ['CREATE TABLE t1 (\n  c1 int,', [28, null, [error]]],
        // 5th: Shrinking mode: Tries with line 3 only.
        ['CREATE TABLE t1 (', [18, null, [error]]],
        // 6th: Reverts to previous attempt (lines 3-5). Note: This is redundant and could be optimized.
        ['CREATE TABLE t1 (\n  c1 int,\n  c2 int,', [38, null, [error]]],
        // 7th: Expanding mode: Tries lines 3-6.
        [
          'CREATE TABLE t1 (\n  c1 int,\n  c2 int,\n  c3 int,',
          [48, null, [error]],
        ],
        // 8th: Expanding mode: Tries lines 3-7.
        [
          'CREATE TABLE t1 (\n  c1 int,\n  c2 int,\n  c3 int,\n  c4 int',
          [57, null, [error]],
        ],
        // 9th: Expanding mode: Tries lines 3-8 (complete statement).
        [
          'CREATE TABLE t1 (\n  c1 int,\n  c2 int,\n  c3 int,\n  c4 int\n);',
          [null, null, []],
        ],
      ]

      const callback = createMockCallback(expectedCalls)
      const wrapperCallback = async (
        chunk: string,
      ): Promise<SQLCallbackResult> => {
        const result = await callback(chunk)
        return result.match(
          (value) => value,
          (error) => [
            null,
            null,
            [new UnexpectedTokenWarningError(error.message)],
          ],
        )
      }
      const errors = await processSQLInChunks(input, chunkSize, wrapperCallback)

      expect(errors).toEqual([])
      expect(callback).toHaveBeenCalledTimes(expectedCalls.length)
    })
  })
})
