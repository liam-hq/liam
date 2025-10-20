import type { AnalyzedRequirements } from '@liam-hq/agent/client'
import { describe, expect, it } from 'vitest'
import { formatArtifactToMarkdown } from '../formatArtifactToMarkdown'

describe('formatArtifactToMarkdown', () => {
  describe('main function', () => {
    it('should format complete artifact with all sections', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Define database requirements for consistently managing airline-owned aircraft, operated flights, and pilots (captains and first officers) involved in operations, while maintaining scheduled and actual times for flights. This enables consistent tracking of aircraft used and personnel assigned for each flight.',
        testcases: {
          'Aircraft Management': [
            {
              id: '1',
              title: 'Aircraft Registration and Update',
              type: 'INSERT',
              sql: `BEGIN;
INSERT INTO airplanes (airplane_number, model, capacity) VALUES
  ('JA100A', 'ATR42-600', 48),
  ('JA200B', 'Bombardier CRJ900', 90),
  ('JA330C', 'Flying Car Alpha', 5);
COMMIT;`,
              testResults: [
                {
                  executedAt: '2024-06-01T08:00:00Z',
                  success: true,
                  message: '3 rows inserted',
                },
              ],
            },
            {
              id: '2',
              title: 'View Flights by Aircraft',
              type: 'SELECT',
              sql: `SELECT f.flight_name, f.scheduled_departure, f.scheduled_arrival, f.origin, f.destination
FROM flights f
WHERE f.airplane_number = 'JA100A'
  AND f.scheduled_departure >= '2024-06-01 00:00:00+09'
  AND f.scheduled_arrival <= '2024-06-02 23:59:59+09'
ORDER BY f.scheduled_departure;`,
              testResults: [
                {
                  executedAt: '2024-06-02T10:00:00Z',
                  success: true,
                  message: '2 rows returned',
                },
              ],
            },
          ],
          'Flight Information Management': [
            {
              id: '3',
              title: 'Flight Schedule Creation',
              type: 'INSERT',
              sql: `INSERT INTO flights (id, flight_name, origin, destination, scheduled_departure, scheduled_arrival, airplane_number, captain_id, first_officer_id)
VALUES ('fc70279f-04d3-41ea-97e9-3a1bb7ee358f', 'JAL101', 'Tokyo', 'Osaka', '2024-06-01 08:00:00+09', '2024-06-01 09:10:00+09', 'JA100A', 'P0001', 'P0002');`,
              testResults: [
                {
                  executedAt: '2024-05-30T14:00:00Z',
                  success: true,
                  message: '1 row inserted',
                },
              ],
            },
            {
              id: '4',
              title: 'Recording Actual Flight Times',
              type: 'UPDATE',
              sql: `UPDATE flights SET actual_start = '2024-06-01 08:05:00+09', actual_end = '2024-06-01 09:12:00+09'
WHERE id = 'fc70279f-04d3-41ea-97e9-3a1bb7ee358f';`,
              testResults: [
                {
                  executedAt: '2024-06-01T09:15:00Z',
                  success: true,
                  message: '1 row updated',
                },
              ],
            },
          ],
          'Pilot Management': [
            {
              id: '5',
              title: 'Pilot (Captain/First Officer) Registration',
              type: 'INSERT',
              sql: `INSERT INTO pilots (pilot_id, name, phone) VALUES
  ('P0001', 'Taro Sato', '+81-90-1234-5678'),
  ('P0002', 'Hanako Yamada', '+81-90-2345-6789');`,
              testResults: [
                {
                  executedAt: '2024-05-25T10:00:00Z',
                  success: false,
                  message:
                    'ERROR: duplicate key value violates unique constraint "pk_pilots"',
                },
                {
                  executedAt: '2024-05-25T10:05:00Z',
                  success: true,
                  message: '2 rows inserted',
                },
              ],
            },
          ],
          'Data Integrity and Validation': [
            {
              id: '6',
              title: 'Referential Integrity Verification',
              type: 'DELETE',
              sql: `DELETE FROM airplanes WHERE airplane_number = 'JA330C';`,
              testResults: [
                {
                  executedAt: '2024-06-03T11:00:00Z',
                  success: false,
                  message:
                    'ERROR: update or delete on table "airplanes" violates foreign key constraint "fk_flights_airplane"',
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)
      expect(result).toMatchInlineSnapshot(`
        "# Requirements Document

        This document outlines system requirements and their associated data manipulation language (DML) operations.

        ---

        ## 📋 Goal

        Define database requirements for consistently managing airline-owned aircraft, operated flights, and pilots (captains and first officers) involved in operations, while maintaining scheduled and actual times for flights. This enables consistent tracking of aircraft used and personnel assigned for each flight.

        ## 🔧 Test cases

        ### 1. Aircraft Management

        #### 1.1. Aircraft Registration and Update

        ##### **INSERT** - Aircraft Registration and Update

        \`\`\`sql
        BEGIN;
        INSERT INTO airplanes (airplane_number, model, capacity) VALUES
          ('JA100A', 'ATR42-600', 48),
          ('JA200B', 'Bombardier CRJ900', 90),
          ('JA330C', 'Flying Car Alpha', 5);
        COMMIT;
        \`\`\`

        **Test Results:**

        ✅ **06/01/2024, 08:00:00 AM**
        > 3 rows inserted


        #### 1.2. View Flights by Aircraft

        ##### **SELECT** - View Flights by Aircraft

        \`\`\`sql
        SELECT f.flight_name, f.scheduled_departure, f.scheduled_arrival, f.origin, f.destination
        FROM flights f
        WHERE f.airplane_number = 'JA100A'
          AND f.scheduled_departure >= '2024-06-01 00:00:00+09'
          AND f.scheduled_arrival <= '2024-06-02 23:59:59+09'
        ORDER BY f.scheduled_departure;
        \`\`\`

        **Test Results:**

        ✅ **06/02/2024, 10:00:00 AM**
        > 2 rows returned


        ---

        ### 2. Flight Information Management

        #### 2.1. Flight Schedule Creation

        ##### **INSERT** - Flight Schedule Creation

        \`\`\`sql
        INSERT INTO flights (id, flight_name, origin, destination, scheduled_departure, scheduled_arrival, airplane_number, captain_id, first_officer_id)
        VALUES ('fc70279f-04d3-41ea-97e9-3a1bb7ee358f', 'JAL101', 'Tokyo', 'Osaka', '2024-06-01 08:00:00+09', '2024-06-01 09:10:00+09', 'JA100A', 'P0001', 'P0002');
        \`\`\`

        **Test Results:**

        ✅ **05/30/2024, 02:00:00 PM**
        > 1 row inserted


        #### 2.2. Recording Actual Flight Times

        ##### **UPDATE** - Recording Actual Flight Times

        \`\`\`sql
        UPDATE flights SET actual_start = '2024-06-01 08:05:00+09', actual_end = '2024-06-01 09:12:00+09'
        WHERE id = 'fc70279f-04d3-41ea-97e9-3a1bb7ee358f';
        \`\`\`

        **Test Results:**

        ✅ **06/01/2024, 09:15:00 AM**
        > 1 row updated


        ---

        ### 3. Pilot Management

        #### 3.1. Pilot (Captain/First Officer) Registration

        ##### **INSERT** - Pilot (Captain/First Officer) Registration

        \`\`\`sql
        INSERT INTO pilots (pilot_id, name, phone) VALUES
          ('P0001', 'Taro Sato', '+81-90-1234-5678'),
          ('P0002', 'Hanako Yamada', '+81-90-2345-6789');
        \`\`\`

        **Test Results:**

        ❌ **05/25/2024, 10:00:00 AM**
        > ERROR: duplicate key value violates unique constraint "pk_pilots"

        ✅ **05/25/2024, 10:05:00 AM**
        > 2 rows inserted


        ---

        ### 4. Data Integrity and Validation

        #### 4.1. Referential Integrity Verification

        ##### **DELETE** - Referential Integrity Verification

        \`\`\`sql
        DELETE FROM airplanes WHERE airplane_number = 'JA330C';
        \`\`\`

        **Test Results:**

        ❌ **06/03/2024, 11:00:00 AM**
        > ERROR: update or delete on table "airplanes" violates foreign key constraint "fk_flights_airplane"

        "
      `)
    })

    it('should handle artifact with empty testcases', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Task management system',
        testcases: {},
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('## 📋 Goal')
      expect(result).toContain('Task management system')
      expect(result).not.toContain('## 🔧 Test cases')
    })

    it('should format multiple categories with proper numbering', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Multi-requirement system',
        testcases: {
          'Feature A': [],
          'Feature B': [],
          'Requirement X': [],
          'Requirement Y': [],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toMatch(/### 1\. Feature A[\s\S]*### 2\. Feature B/)
      expect(result).toMatch(
        /### 3\. Requirement X[\s\S]*### 4\. Requirement Y/,
      )
    })

    it('should add separators between functional requirements', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          First: [],
          Second: [],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)
      const lines = result.split('\n')

      const firstIndex = lines.indexOf('### 1. First')
      const secondIndex = lines.indexOf('### 2. Second')
      const separatorIndex = lines.findIndex(
        (line, index) =>
          index > firstIndex && index < secondIndex && line === '---',
      )

      expect(separatorIndex).toBeGreaterThan(firstIndex)
      expect(separatorIndex).toBeLessThan(secondIndex)
    })
  })

  describe('test case formatting', () => {
    it('should format successful execution results', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'Test Case',
              type: 'SELECT',
              sql: 'SELECT * FROM users',
              testResults: [
                {
                  executedAt: '2024-03-20T14:45:30Z',
                  success: true,
                  message: '25 rows returned',
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('**Test Results:**')
      expect(result).toContain('✅ **03/20/2024, 02:45:30 PM**')
      expect(result).toContain('> 25 rows returned')
    })

    it('should format failed execution results', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'Test Case',
              type: 'INSERT',
              sql: 'INSERT INTO users (email) VALUES ($1)',
              testResults: [
                {
                  executedAt: '2024-03-20T14:45:30Z',
                  success: false,
                  message: 'Unique constraint violation',
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('❌ **03/20/2024, 02:45:30 PM**')
      expect(result).toContain('> Unique constraint violation')
    })

    it('should format multiple execution results', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'Test Case',
              type: 'INSERT',
              sql: 'INSERT INTO orders (user_id, total) VALUES ($1, $2)',
              testResults: [
                {
                  executedAt: '2024-03-20T10:00:00Z',
                  success: false,
                  message: 'Connection timeout',
                },
                {
                  executedAt: '2024-03-20T10:01:00Z',
                  success: true,
                  message: '1 row inserted',
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('❌ **03/20/2024, 10:00:00 AM**')
      expect(result).toContain('> Connection timeout')
      expect(result).toContain('✅ **03/20/2024, 10:01:00 AM**')
      expect(result).toContain('> 1 row inserted')
    })

    it('should not show execution section when no results exist', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'Test Case',
              type: 'SELECT',
              sql: 'SELECT * FROM products',
              testResults: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).not.toContain('**Test Results:**')
    })

    it('should trim SQL whitespace', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'Test Case',
              type: 'SELECT',
              sql: '  \n  SELECT * FROM users  \n  ',
              testResults: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('```sql\nSELECT * FROM users\n```')
      expect(result).not.toContain('  SELECT')
    })

    it('should show placeholder message when SQL is empty', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'Test Case',
              type: 'INSERT',
              sql: '',
              testResults: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain(
        '```sql\n-- SQL statement not yet generated\n```',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle all operation types', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Test all operations',
        testcases: {
          'Test Feature': [
            {
              id: '1',
              title: 'INSERT Operation',
              type: 'INSERT',
              sql: 'INSERT INTO test',
              testResults: [],
            },
            {
              id: '2',
              title: 'UPDATE Operation',
              type: 'UPDATE',
              sql: 'UPDATE test',
              testResults: [],
            },
            {
              id: '3',
              title: 'DELETE Operation',
              type: 'DELETE',
              sql: 'DELETE FROM test',
              testResults: [],
            },
            {
              id: '4',
              title: 'SELECT Operation',
              type: 'SELECT',
              sql: 'SELECT * FROM test',
              testResults: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('**INSERT**')
      expect(result).toContain('**UPDATE**')
      expect(result).toContain('**DELETE**')
      expect(result).toContain('**SELECT**')
    })

    it('should handle very long text content gracefully', () => {
      const longDescription = 'A'.repeat(500)
      const longSQL = `SELECT ${'column,'.repeat(50)} FROM table`

      const analyzedRequirements: AnalyzedRequirements = {
        goal: longDescription,
        testcases: {
          'Long Feature': [
            {
              id: '1',
              title: 'Long Test Case',
              type: 'SELECT',
              sql: longSQL,
              testResults: [
                {
                  executedAt: '2024-01-01T00:00:00Z',
                  success: true,
                  message: longDescription,
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain(longDescription)
      expect(result).toContain(longSQL)
    })

    it('should preserve markdown-safe characters in content', () => {
      const analyzedRequirements: AnalyzedRequirements = {
        goal: 'Special chars: * _ ` # [ ] ( ) ! < >',
        testcases: {
          'Special & Characters': [
            {
              id: '1',
              title: 'Use Case [with brackets]',
              type: 'SELECT',
              sql: 'SELECT * FROM users WHERE name = "John\'s"',
              testResults: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(analyzedRequirements)

      expect(result).toContain('Special chars: * _ ` # [ ] ( ) ! < >')
      expect(result).toContain('Special & Characters')
      expect(result).toContain('Use Case [with brackets]')
      expect(result).toContain('"John\'s"')
    })
  })
})
