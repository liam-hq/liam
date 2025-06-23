import {
  aColumn,
  anIndex,
  aUniqueConstraint,
  type Schema,
  type Table,
} from '../../schema/index.js'

export const createParserTestCases = (
  userTable: (override?: Partial<Table>) => Schema,
) => ({
  normal: userTable({
    columns: {
      name: aColumn({
        name: 'name',
        type: 'varchar',
        notNull: true,
      }),
    },
  }),
  'table comment': userTable({
    comment: 'store our users.',
  }),
  'column comment': userTable({
    columns: {
      description: aColumn({
        name: 'description',
        type: 'text',
        comment: 'this is description',
      }),
    },
  }),
  'not null': userTable({
    columns: {
      name: aColumn({
        name: 'name',
        type: 'varchar',
        notNull: true,
      }),
    },
  }),
  nullable: userTable({
    columns: {
      description: aColumn({
        name: 'description',
        type: 'text',
        notNull: false,
      }),
    },
  }),
  'default value as string': userTable({
    columns: {
      description: aColumn({
        name: 'description',
        type: 'text',
        default: "user's description",
      }),
    },
  }),
  'default value as integer': userTable({
    columns: {
      age: aColumn({
        name: 'age',
        type: 'int4',
        default: 30,
      }),
    },
  }),
  'default value as boolean': userTable({
    columns: {
      active: aColumn({
        name: 'active',
        type: 'bool',
        default: true,
      }),
    },
  }),
  unique: userTable({
    columns: {
      mention: aColumn({
        name: 'mention',
        type: 'text',
      }),
    },
    constraints: {
      UNIQUE_mention: aUniqueConstraint({
        name: 'UNIQUE_mention',
        columnName: 'mention',
      }),
    },
  }),
  'index (unique: false)': (indexName: string, type: string) =>
    userTable({
      columns: {
        email: aColumn({
          name: 'email',
        }),
      },
      indexes: {
        [indexName]: anIndex({
          name: indexName,
          unique: false,
          type,
          columns: ['id', 'email'],
        }),
      },
    }),
  'index (unique: true)': (type: string) =>
    userTable({
      columns: {
        email: aColumn({
          name: 'email',
        }),
      },
      indexes: {
        index_users_on_email: anIndex({
          name: 'index_users_on_email',
          unique: true,
          type,
          columns: ['email'],
        }),
      },
    }),
  'foreign key (one-to-many)': (name: string) => ({
    [name]: {
      name,
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'user_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'NO_ACTION',
      deleteConstraint: 'NO_ACTION',
    },
  }),
  'foreign key (one-to-one)': (name: string) => ({
    [name]: {
      name,
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'user_id',
      cardinality: 'ONE_TO_ONE',
      updateConstraint: 'NO_ACTION',
      deleteConstraint: 'NO_ACTION',
    },
  }),
  'foreign key with action': {
    fk_posts_user_id: {
      name: 'fk_posts_user_id',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'user_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'RESTRICT',
      deleteConstraint: 'CASCADE',
    },
  },
})
