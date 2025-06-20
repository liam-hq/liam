import { describe, expect, it } from 'vitest'
import type { Schema } from '../../../../packages/db-structure/src/schema/schema'
import { evaluate } from './evaluate'

// Increase timeout due to model initialization
const TIMEOUT = 30000

describe('evaluate', () => {
  it(
    'simple case: full match',
    async () => {
      const reference: Schema = {
        tables: {
          user: {
            name: 'user',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              name: {
                name: 'name',
                type: 'VARCHAR(100)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_user: {
                type: 'PRIMARY KEY',
                name: 'pk_user',
                columnName: 'id',
              },
            },
          },
          post: {
            name: 'post',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              user_id: {
                name: 'user_id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
              content: {
                name: 'content',
                type: 'TEXT',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_post: {
                type: 'PRIMARY KEY',
                name: 'pk_post',
                columnName: 'id',
              },
              fk_post_user: {
                type: 'FOREIGN KEY',
                name: 'fk_post_user',
                columnName: 'user_id',
                targetTableName: 'user',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          },
        },
        relationships: {
          user_post: {
            name: 'user_post',
            primaryTableName: 'user',
            primaryColumnName: 'id',
            foreignTableName: 'post',
            foreignColumnName: 'user_id',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
        tableGroups: {},
      }

      const predict: Schema = {
        tables: {
          user: {
            name: 'user',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              name: {
                name: 'name',
                type: 'VARCHAR(100)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_user: {
                type: 'PRIMARY KEY',
                name: 'pk_user',
                columnName: 'id',
              },
            },
          },
          post: {
            name: 'post',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              user_id: {
                name: 'user_id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
              content: {
                name: 'content',
                type: 'TEXT',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_post: {
                type: 'PRIMARY KEY',
                name: 'pk_post',
                columnName: 'id',
              },
              fk_post_user: {
                type: 'FOREIGN KEY',
                name: 'fk_post_user',
                columnName: 'user_id',
                targetTableName: 'user',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          },
        },
        relationships: {
          user_post: {
            name: 'user_post',
            primaryTableName: 'user',
            primaryColumnName: 'id',
            foreignTableName: 'post',
            foreignColumnName: 'user_id',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
        tableGroups: {},
      }

      const result = await evaluate(reference, predict)

      expect(result.tableF1).toBe(1)
      expect(result.tableAllcorrect).toBe(1)
      expect(result.columnF1Avg).toBeCloseTo(1)
      expect(result.primaryKeyAvg).toBeCloseTo(1)
      expect(result.foreignKeyAvg).toBeCloseTo(1)
      expect(result.relationshipF1).toBe(1)
      expect(result.schemaAllcorrectFull).toBe(1)
    },
    TIMEOUT,
  )

  it(
    'partial match: similar table names',
    async () => {
      const reference: Schema = {
        tables: {
          user_account: {
            name: 'user_account',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'VARCHAR(255)',
                default: null,
                check: null,
                primary: false,
                unique: true,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_user_account: {
                type: 'PRIMARY KEY',
                name: 'pk_user_account',
                columnName: 'id',
              },
            },
          },
          blog_post: {
            name: 'blog_post',
            columns: {
              post_id: {
                name: 'post_id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              title: {
                name: 'title',
                type: 'VARCHAR(200)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_blog_post: {
                type: 'PRIMARY KEY',
                name: 'pk_blog_post',
                columnName: 'post_id',
              },
            },
          },
        },
        relationships: {},
        tableGroups: {},
      }

      const predict: Schema = {
        tables: {
          user: {
            name: 'user',
            columns: {
              user_id: {
                name: 'user_id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              email_address: {
                name: 'email_address',
                type: 'VARCHAR(255)',
                default: null,
                check: null,
                primary: false,
                unique: true,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_user: {
                type: 'PRIMARY KEY',
                name: 'pk_user',
                columnName: 'user_id',
              },
            },
          },
          post: {
            name: 'post',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              post_title: {
                name: 'post_title',
                type: 'VARCHAR(200)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_post: {
                type: 'PRIMARY KEY',
                name: 'pk_post',
                columnName: 'id',
              },
            },
          },
        },
        relationships: {},
        tableGroups: {},
      }

      const result = await evaluate(reference, predict)

      // Tables should match due to semantic similarity (user_account -> user, blog_post -> post)
      expect(result.tableF1).toBeCloseTo(1, 1)
      expect(result.tableAllcorrect).toBe(1)

      // Columns should partially match (email -> email_address, title -> post_title)
      expect(result.columnF1Avg).toBeGreaterThan(0.4)
      expect(result.columnF1Avg).toBeLessThan(0.8)
      expect(result.columnAllcorrectAvg).toBeCloseTo(0.5, 1)

      // Primary keys should partially match (different column names)
      expect(result.primaryKeyAvg).toBeCloseTo(0.5, 1)
      expect(result.schemaAllcorrectFull).toBe(0)
    },
    TIMEOUT,
  )

  it(
    'mixed similarity: some exact, some partial matches',
    async () => {
      const reference: Schema = {
        tables: {
          customer: {
            name: 'customer',
            columns: {
              customer_id: {
                name: 'customer_id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              first_name: {
                name: 'first_name',
                type: 'VARCHAR(50)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
              last_name: {
                name: 'last_name',
                type: 'VARCHAR(50)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
              email: {
                name: 'email',
                type: 'VARCHAR(255)',
                default: null,
                check: null,
                primary: false,
                unique: true,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_customer: {
                type: 'PRIMARY KEY',
                name: 'pk_customer',
                columnName: 'customer_id',
              },
            },
          },
        },
        relationships: {},
        tableGroups: {},
      }

      const predict: Schema = {
        tables: {
          customer: {
            name: 'customer',
            columns: {
              id: {
                name: 'id',
                type: 'INTEGER',
                default: null,
                check: null,
                primary: true,
                unique: false,
                notNull: true,
                comment: null,
              },
              first_name: {
                name: 'first_name',
                type: 'VARCHAR(50)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
              surname: {
                name: 'surname',
                type: 'VARCHAR(50)',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: null,
              },
              email_address: {
                name: 'email_address',
                type: 'VARCHAR(255)',
                default: null,
                check: null,
                primary: false,
                unique: true,
                notNull: true,
                comment: null,
              },
            },
            comment: null,
            indexes: {},
            constraints: {
              pk_customer: {
                type: 'PRIMARY KEY',
                name: 'pk_customer',
                columnName: 'id',
              },
            },
          },
        },
        relationships: {},
        tableGroups: {},
      }

      const result = await evaluate(reference, predict)

      // Perfect table match
      expect(result.tableF1).toBe(1)
      expect(result.tableAllcorrect).toBe(1)

      // Partial column matches: first_name (exact), last_name->surname (similar), email->email_address (similar)
      // customer_id->id (partial), so 3/4 should match
      expect(result.columnF1Avg).toBeGreaterThan(0.6)
      expect(result.columnF1Avg).toBeLessThan(0.9)
      expect(result.columnAllcorrectAvg).toBe(0)

      // Primary key mismatch (customer_id vs id)
      expect(result.primaryKeyAvg).toBe(1)
      expect(result.schemaAllcorrectFull).toBe(0)
    },
    TIMEOUT,
  )
})
