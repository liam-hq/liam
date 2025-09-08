import type { Artifact } from '@liam-hq/artifact'
import { describe, expect, it } from 'vitest'
import { formatArtifactToMarkdown } from '../formatArtifactToMarkdown'

describe('formatArtifactToMarkdown', () => {
  describe('main function', () => {
    it('should format complete artifact with all sections', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement:
            'Define database requirements for consistently managing airline-owned aircraft, operated flights, and pilots (captains and first officers) involved in operations, while maintaining scheduled and actual times for flights. This enables consistent tracking of aircraft used and personnel assigned for each flight.',
          requirements: [
            {
              name: 'Aircraft Management',
              description: [
                'The company owns multiple aircraft, each with an aircraft number, model, and seating capacity. The aircraft number must be unique, and seating capacity must be an integer greater than 0.',
              ],
              type: 'functional',
              test_cases: [
                {
                  title: 'Aircraft Registration and Update',
                  description:
                    'The operations manager opens the aircraft management screen, selects "New Registration", and enters the aircraft number, model, and seating capacity. Upon clicking the register button, the system verifies required field entry, confirms aircraft number uniqueness, checks that seating capacity is a positive number, then records it in the aircraft registry.',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: `BEGIN;
INSERT INTO airplanes (airplane_number, model, capacity) VALUES
  ('JA100A', 'ATR42-600', 48),
  ('JA200B', 'Bombardier CRJ900', 90),
  ('JA330C', 'Flying Car Alpha', 5);
COMMIT;`,
                    description:
                      'New aircraft registration test including normal cases and edge cases (capacity 1/0, model names with special characters and non-ASCII).',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-06-01T08:00:00Z',
                        success: true,
                        result_summary: '3 rows inserted',
                      },
                    ],
                  },
                },
                {
                  title: 'View Flights by Aircraft',
                  description:
                    'The operations manager specifies an aircraft number on the search screen and searches with period and route conditions. The system extracts flights associated with the specified aircraft within the period and displays a list of flight names, departure times, arrival times, segments, assigned captain and first officer.',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: `SELECT f.flight_name, f.scheduled_departure, f.scheduled_arrival, f.origin, f.destination
FROM flights f
WHERE f.airplane_number = 'JA100A'
  AND f.scheduled_departure >= '2024-06-01 00:00:00+09'
  AND f.scheduled_arrival <= '2024-06-02 23:59:59+09'
ORDER BY f.scheduled_departure;`,
                    description:
                      'Retrieve flight list within period for specified aircraft (JA100A). Verify date boundaries and flight names.',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-06-02T10:00:00Z',
                        success: true,
                        result_summary: '2 rows returned',
                      },
                    ],
                  },
                },
              ],
            },
            {
              name: 'Flight Information Management',
              description: [
                'Flight information includes flight name, departure time, arrival time, origin, destination, aircraft number, captain ID, first officer ID, start time, and end time. Origin and destination cannot be the same, and scheduled times must satisfy departure time < arrival time.',
              ],
              type: 'functional',
              test_cases: [
                {
                  title: 'Flight Schedule Creation',
                  description:
                    'The schedule coordinator enters flight name, departure time, arrival time, origin, and destination on the flight creation screen, then selects aircraft number and pilot IDs. The system validates the input values before saving.',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: `INSERT INTO flights (id, flight_name, origin, destination, scheduled_departure, scheduled_arrival, airplane_number, captain_id, first_officer_id)
VALUES ('fc70279f-04d3-41ea-97e9-3a1bb7ee358f', 'JAL101', 'Tokyo', 'Osaka', '2024-06-01 08:00:00+09', '2024-06-01 09:10:00+09', 'JA100A', 'P0001', 'P0002');`,
                    description:
                      'Representative flight creation (Tokyo to Osaka route)',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-05-30T14:00:00Z',
                        success: true,
                        result_summary: '1 row inserted',
                      },
                    ],
                  },
                },
                {
                  title: 'Recording Actual Flight Times',
                  description:
                    'After operation, the operations coordinator opens the target flight details screen and enters the start time (actual departure) and end time (actual arrival) then saves.',
                  dmlOperation: {
                    operation_type: 'UPDATE',
                    sql: `UPDATE flights SET actual_start = '2024-06-01 08:05:00+09', actual_end = '2024-06-01 09:12:00+09'
WHERE id = 'fc70279f-04d3-41ea-97e9-3a1bb7ee358f';`,
                    description:
                      'Record actual departure and arrival times simultaneously (normal case including delays).',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-06-01T09:15:00Z',
                        success: true,
                        result_summary: '1 row updated',
                      },
                    ],
                  },
                },
              ],
            },
            {
              name: 'Pilot Management',
              description: [
                'Each flight is operated by a captain and first officer, each with an ID, name, and phone number. Pilot IDs must be unique, and for flights, the captain ID and first officer ID cannot be the same person.',
              ],
              type: 'functional',
              test_cases: [
                {
                  title: 'Pilot (Captain/First Officer) Registration',
                  description:
                    'HR or operations manager selects "New Registration" from the pilot roster screen and enters pilot ID, name, and phone number then saves.',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: `INSERT INTO pilots (pilot_id, name, phone) VALUES
  ('P0001', 'Taro Sato', '+81-90-1234-5678'),
  ('P0002', 'Hanako Yamada', '+81-90-2345-6789');`,
                    description:
                      'Multiple pilot registration (diverse name and phone number formats)',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-05-25T10:00:00Z',
                        success: false,
                        result_summary:
                          'ERROR: duplicate key value violates unique constraint "pk_pilots"',
                      },
                      {
                        executed_at: '2024-05-25T10:05:00Z',
                        success: true,
                        result_summary: '2 rows inserted',
                      },
                    ],
                  },
                },
              ],
            },
            {
              name: 'Data Integrity and Validation',
              description: [
                'Enforce referential integrity through foreign keys and implement various business rules through CHECK constraints. Protect related data with ON DELETE RESTRICT during deletions.',
              ],
              type: 'functional',
              test_cases: [
                {
                  title: 'Referential Integrity Verification',
                  description:
                    'Verify that the system properly returns errors when attempting to delete aircraft with existing flights or pilots assigned to flights.',
                  dmlOperation: {
                    operation_type: 'DELETE',
                    sql: `DELETE FROM airplanes WHERE airplane_number = 'JA330C';`,
                    description:
                      'Delete aircraft with remaining flights (expecting referential integrity error: ON DELETE RESTRICT).',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-06-03T11:00:00Z',
                        success: false,
                        result_summary:
                          'ERROR: update or delete on table "airplanes" violates foreign key constraint "fk_flights_airplane"',
                      },
                    ],
                  },
                },
              ],
            },
            {
              name: 'Performance',
              description: [
                'The system must be able to search 1000 flight records within 3 seconds and support concurrent access from 50 users.',
              ],
              type: 'non_functional',
            },
            {
              name: 'Security',
              description: [
                'Pilot personal information must be encrypted for storage and access logs must be recorded. Database access must be restricted to authenticated users only.',
              ],
              type: 'non_functional',
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)
      expect(result).toMatchInlineSnapshot(`
        "# Requirements Document

        This document outlines system requirements and their associated data manipulation language (DML) operations.

        ---

        ## 📋 Business Requirements

        Define database requirements for consistently managing airline-owned aircraft, operated flights, and pilots (captains and first officers) involved in operations, while maintaining scheduled and actual times for flights. This enables consistent tracking of aircraft used and personnel assigned for each flight.

        ## 🔧 Functional Requirements

        ### 1. Aircraft Management

        - The company owns multiple aircraft, each with an aircraft number, model, and seating capacity. The aircraft number must be unique, and seating capacity must be an integer greater than 0.


        **Test Cases:**

        #### 1.1. Aircraft Registration and Update

        The operations manager opens the aircraft management screen, selects "New Registration", and enters the aircraft number, model, and seating capacity. Upon clicking the register button, the system verifies required field entry, confirms aircraft number uniqueness, checks that seating capacity is a positive number, then records it in the aircraft registry.

        ##### **INSERT** - New aircraft registration test including normal cases and edge cases (capacity 1/0, model names with special characters and non-ASCII).

        \`\`\`sql
        BEGIN;
        INSERT INTO airplanes (airplane_number, model, capacity) VALUES
          ('JA100A', 'ATR42-600', 48),
          ('JA200B', 'Bombardier CRJ900', 90),
          ('JA330C', 'Flying Car Alpha', 5);
        COMMIT;
        \`\`\`

        **Execution History:**

        ✅ **06/01/2024, 08:00:00 AM**
        > 3 rows inserted


        #### 1.2. View Flights by Aircraft

        The operations manager specifies an aircraft number on the search screen and searches with period and route conditions. The system extracts flights associated with the specified aircraft within the period and displays a list of flight names, departure times, arrival times, segments, assigned captain and first officer.

        ##### **SELECT** - Retrieve flight list within period for specified aircraft (JA100A). Verify date boundaries and flight names.

        \`\`\`sql
        SELECT f.flight_name, f.scheduled_departure, f.scheduled_arrival, f.origin, f.destination
        FROM flights f
        WHERE f.airplane_number = 'JA100A'
          AND f.scheduled_departure >= '2024-06-01 00:00:00+09'
          AND f.scheduled_arrival <= '2024-06-02 23:59:59+09'
        ORDER BY f.scheduled_departure;
        \`\`\`

        **Execution History:**

        ✅ **06/02/2024, 10:00:00 AM**
        > 2 rows returned


        ---

        ### 2. Flight Information Management

        - Flight information includes flight name, departure time, arrival time, origin, destination, aircraft number, captain ID, first officer ID, start time, and end time. Origin and destination cannot be the same, and scheduled times must satisfy departure time < arrival time.


        **Test Cases:**

        #### 2.1. Flight Schedule Creation

        The schedule coordinator enters flight name, departure time, arrival time, origin, and destination on the flight creation screen, then selects aircraft number and pilot IDs. The system validates the input values before saving.

        ##### **INSERT** - Representative flight creation (Tokyo to Osaka route)

        \`\`\`sql
        INSERT INTO flights (id, flight_name, origin, destination, scheduled_departure, scheduled_arrival, airplane_number, captain_id, first_officer_id)
        VALUES ('fc70279f-04d3-41ea-97e9-3a1bb7ee358f', 'JAL101', 'Tokyo', 'Osaka', '2024-06-01 08:00:00+09', '2024-06-01 09:10:00+09', 'JA100A', 'P0001', 'P0002');
        \`\`\`

        **Execution History:**

        ✅ **05/30/2024, 02:00:00 PM**
        > 1 row inserted


        #### 2.2. Recording Actual Flight Times

        After operation, the operations coordinator opens the target flight details screen and enters the start time (actual departure) and end time (actual arrival) then saves.

        ##### **UPDATE** - Record actual departure and arrival times simultaneously (normal case including delays).

        \`\`\`sql
        UPDATE flights SET actual_start = '2024-06-01 08:05:00+09', actual_end = '2024-06-01 09:12:00+09'
        WHERE id = 'fc70279f-04d3-41ea-97e9-3a1bb7ee358f';
        \`\`\`

        **Execution History:**

        ✅ **06/01/2024, 09:15:00 AM**
        > 1 row updated


        ---

        ### 3. Pilot Management

        - Each flight is operated by a captain and first officer, each with an ID, name, and phone number. Pilot IDs must be unique, and for flights, the captain ID and first officer ID cannot be the same person.


        **Test Cases:**

        #### 3.1. Pilot (Captain/First Officer) Registration

        HR or operations manager selects "New Registration" from the pilot roster screen and enters pilot ID, name, and phone number then saves.

        ##### **INSERT** - Multiple pilot registration (diverse name and phone number formats)

        \`\`\`sql
        INSERT INTO pilots (pilot_id, name, phone) VALUES
          ('P0001', 'Taro Sato', '+81-90-1234-5678'),
          ('P0002', 'Hanako Yamada', '+81-90-2345-6789');
        \`\`\`

        **Execution History:**

        ❌ **05/25/2024, 10:00:00 AM**
        > ERROR: duplicate key value violates unique constraint "pk_pilots"

        ✅ **05/25/2024, 10:05:00 AM**
        > 2 rows inserted


        ---

        ### 4. Data Integrity and Validation

        - Enforce referential integrity through foreign keys and implement various business rules through CHECK constraints. Protect related data with ON DELETE RESTRICT during deletions.


        **Test Cases:**

        #### 4.1. Referential Integrity Verification

        Verify that the system properly returns errors when attempting to delete aircraft with existing flights or pilots assigned to flights.

        ##### **DELETE** - Delete aircraft with remaining flights (expecting referential integrity error: ON DELETE RESTRICT).

        \`\`\`sql
        DELETE FROM airplanes WHERE airplane_number = 'JA330C';
        \`\`\`

        **Execution History:**

        ❌ **06/03/2024, 11:00:00 AM**
        > ERROR: update or delete on table "airplanes" violates foreign key constraint "fk_flights_airplane"



        ## 📊 Non-Functional Requirements

        ### 1. Performance

        - The system must be able to search 1000 flight records within 3 seconds and support concurrent access from 50 users.


        ---

        ### 2. Security

        - Pilot personal information must be encrypted for storage and access logs must be recorded. Database access must be restricted to authenticated users only.
        "
      `)
    })

    it('should handle artifact with only functional requirements', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Task management system',
          requirements: [
            {
              name: 'Task CRUD',
              description: ['Create, read, update, delete tasks'],
              type: 'functional',
              test_cases: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('## 🔧 Functional Requirements')
      expect(result).not.toContain('## 📊 Non-Functional Requirements')
    })

    it('should handle artifact with only non-functional requirements', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'System optimization',
          requirements: [
            {
              name: 'Security',
              description: ['All data must be encrypted'],
              type: 'non_functional',
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).not.toContain('## 🔧 Functional Requirements')
      expect(result).toContain('## 📊 Non-Functional Requirements')
    })

    it('should handle empty requirements array', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Empty project',
          requirements: [],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('## 📋 Business Requirements')
      expect(result).toContain('Empty project')
      expect(result).not.toContain('## 🔧 Functional Requirements')
      expect(result).not.toContain('## 📊 Non-Functional Requirements')
    })

    it('should format multiple requirements with proper numbering', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Multi-requirement system',
          requirements: [
            {
              name: 'Feature A',
              description: ['Description A'],
              type: 'functional',
              test_cases: [],
            },
            {
              name: 'Feature B',
              description: ['Description B'],
              type: 'functional',
              test_cases: [],
            },
            {
              name: 'Requirement X',
              description: ['Description X'],
              type: 'non_functional',
            },
            {
              name: 'Requirement Y',
              description: ['Description Y'],
              type: 'non_functional',
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toMatch(/### 1\. Feature A[\s\S]*### 2\. Feature B/)
      expect(result).toMatch(
        /### 1\. Requirement X[\s\S]*### 2\. Requirement Y/,
      )
    })

    it('should add separators between functional requirements', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'First',
              description: ['First desc'],
              type: 'functional',
              test_cases: [],
            },
            {
              name: 'Second',
              description: ['Second desc'],
              type: 'functional',
              test_cases: [],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)
      const lines = result.split('\n')

      const firstIndex = lines.findIndex((line) => line === '### 1. First')
      const secondIndex = lines.findIndex((line) => line === '### 2. Second')
      const separatorIndex = lines.findIndex(
        (line, index) =>
          index > firstIndex && index < secondIndex && line === '---',
      )

      expect(separatorIndex).toBeGreaterThan(firstIndex)
      expect(separatorIndex).toBeLessThan(secondIndex)
    })
  })

  describe('DML operation formatting', () => {
    it('should format operation with description', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'UPDATE',
                    sql: 'UPDATE users SET status = $1',
                    description: 'Update user status',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('**UPDATE** - Update user status')
      expect(result).toContain('```sql\nUPDATE users SET status = $1\n```')
    })

    it('should format operation without description', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'DELETE',
                    sql: 'DELETE FROM users WHERE id = $1',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('**DELETE**')
      expect(result).not.toContain('**DELETE** -')
    })

    it('should format successful execution logs', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT * FROM users',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-03-20T14:45:30Z',
                        success: true,
                        result_summary: '25 rows returned',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('**Execution History:**')
      expect(result).toContain('✅ **03/20/2024, 02:45:30 PM**')
      expect(result).toContain('> 25 rows returned')
    })

    it('should format failed execution logs', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: 'INSERT INTO users (email) VALUES ($1)',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-03-20T14:45:30Z',
                        success: false,
                        result_summary: 'Unique constraint violation',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('❌ **03/20/2024, 02:45:30 PM**')
      expect(result).toContain('> Unique constraint violation')
    })

    it('should format multiple execution logs', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: 'INSERT INTO orders (user_id, total) VALUES ($1, $2)',
                    dml_execution_logs: [
                      {
                        executed_at: '2024-03-20T10:00:00Z',
                        success: false,
                        result_summary: 'Connection timeout',
                      },
                      {
                        executed_at: '2024-03-20T10:01:00Z',
                        success: true,
                        result_summary: '1 row inserted',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('❌ **03/20/2024, 10:00:00 AM**')
      expect(result).toContain('> Connection timeout')
      expect(result).toContain('✅ **03/20/2024, 10:01:00 AM**')
      expect(result).toContain('> 1 row inserted')
    })

    it('should not show execution section when no logs exist', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT * FROM products',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).not.toContain('**Execution History:**')
    })

    it('should trim SQL whitespace', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Test Use Case',
                  description: 'Use case description',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: '  \n  SELECT * FROM users  \n  ',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('```sql\nSELECT * FROM users\n```')
      expect(result).not.toContain('  SELECT')
    })
  })

  describe('use case formatting', () => {
    it('should format use case with single DML operation', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Single Operation Use Case',
                  description: 'This use case has one operation',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: 'INSERT INTO logs (message) VALUES ($1)',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('#### 1.1. Single Operation Use Case')
      expect(result).toContain('This use case has one operation')
      expect(result).toContain('##### **INSERT**')
      expect(result).not.toContain('##### Operation 1')
    })

    it('should format use case without DML operations', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test description'],
              type: 'functional',
              test_cases: [
                {
                  title: 'No Operations Use Case',
                  description: 'This use case has no operations yet',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('#### 1.1. No Operations Use Case')
      expect(result).toContain('This use case has no operations yet')
      expect(result).not.toContain('**Related DML Operations:**')
    })

    it('should format multiple use cases with proper numbering', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test',
          requirements: [
            {
              name: 'User Management',
              description: ['User management features'],
              type: 'functional',
              test_cases: [
                {
                  title: 'User Registration',
                  description: 'Register new users',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
                {
                  title: 'User Login',
                  description: 'Authenticate users',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
                {
                  title: 'Password Reset',
                  description: 'Reset user password',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('#### 1.1. User Registration')
      expect(result).toContain('#### 1.2. User Login')
      expect(result).toContain('#### 1.3. Password Reset')
    })

    it('should handle complex nested structure', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Complex system',
          requirements: [
            {
              name: 'Feature 1',
              description: ['First feature'],
              type: 'functional',
              test_cases: [
                {
                  title: 'UC 1.1',
                  description: 'First use case',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
                {
                  title: 'UC 1.2',
                  description: 'Second use case',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
            {
              name: 'Feature 2',
              description: ['Second feature'],
              type: 'functional',
              test_cases: [
                {
                  title: 'UC 2.1',
                  description: 'Third use case',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT 1',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('### 1. Feature 1')
      expect(result).toContain('#### 1.1. UC 1.1')
      expect(result).toContain('#### 1.2. UC 1.2')
      expect(result).toContain('### 2. Feature 2')
      expect(result).toContain('#### 2.1. UC 2.1')
    })
  })

  describe('edge cases', () => {
    it('should handle all operation types', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Test all operations',
          requirements: [
            {
              name: 'Test Feature',
              description: ['Test all operation types'],
              type: 'functional',
              test_cases: [
                {
                  title: 'INSERT Operation',
                  description: 'Test INSERT operation',
                  dmlOperation: {
                    operation_type: 'INSERT',
                    sql: 'INSERT INTO test',
                    dml_execution_logs: [],
                  },
                },
                {
                  title: 'UPDATE Operation',
                  description: 'Test UPDATE operation',
                  dmlOperation: {
                    operation_type: 'UPDATE',
                    sql: 'UPDATE test',
                    dml_execution_logs: [],
                  },
                },
                {
                  title: 'DELETE Operation',
                  description: 'Test DELETE operation',
                  dmlOperation: {
                    operation_type: 'DELETE',
                    sql: 'DELETE FROM test',
                    dml_execution_logs: [],
                  },
                },
                {
                  title: 'SELECT Operation',
                  description: 'Test SELECT operation',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT * FROM test',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('**INSERT**')
      expect(result).toContain('**UPDATE**')
      expect(result).toContain('**DELETE**')
      expect(result).toContain('**SELECT**')
    })

    it('should handle very long text content gracefully', () => {
      const longDescription = 'A'.repeat(500)
      const longSQL = `SELECT ${'column,'.repeat(50)} FROM table`

      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: longDescription,
          requirements: [
            {
              name: 'Long Feature',
              description: [longDescription],
              type: 'functional',
              test_cases: [
                {
                  title: 'Long Use Case',
                  description: longDescription,
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: longSQL,
                    description: longDescription,
                    dml_execution_logs: [
                      {
                        executed_at: '2024-01-01T00:00:00Z',
                        success: true,
                        result_summary: longDescription,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain(longDescription)
      expect(result).toContain(longSQL)
    })

    it('should preserve markdown-safe characters in content', () => {
      const artifact: Artifact = {
        requirement_analysis: {
          business_requirement: 'Special chars: * _ ` # [ ] ( ) ! < >',
          requirements: [
            {
              name: 'Special & Characters',
              description: ['Description with **bold** and _italic_ text'],
              type: 'functional',
              test_cases: [
                {
                  title: 'Use Case [with brackets]',
                  description: 'Description with `code` and <tags>',
                  dmlOperation: {
                    operation_type: 'SELECT',
                    sql: 'SELECT * FROM users WHERE name = "John\'s"',
                    description: 'Query with quotes & special chars',
                    dml_execution_logs: [],
                  },
                },
              ],
            },
          ],
        },
      }

      const result = formatArtifactToMarkdown(artifact)

      expect(result).toContain('Special chars: * _ ` # [ ] ( ) ! < >')
      expect(result).toContain('Special & Characters')
      expect(result).toContain('**bold** and _italic_')
      expect(result).toContain('Use Case [with brackets]')
      expect(result).toContain('`code` and <tags>')
      expect(result).toContain('"John\'s"')
    })
  })
})
