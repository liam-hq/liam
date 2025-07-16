import { createSchema } from './testHelpers'

export const simpleUserSchema = createSchema({
  tables: {
    user: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        name: { type: 'VARCHAR(100)', notNull: true },
      },
      primaryKey: ['id'],
    },
    post: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        user_id: { type: 'INTEGER', notNull: true },
        content: { type: 'TEXT', notNull: true },
      },
      primaryKey: ['id'],
    },
  },
})

export const userAccountSchema = createSchema({
  tables: {
    user_account: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        email: { type: 'VARCHAR(255)', notNull: true },
      },
      primaryKey: ['id'],
    },
    blog_post: {
      columns: {
        post_id: { type: 'INTEGER', notNull: true },
        title: { type: 'VARCHAR(200)', notNull: true },
      },
      primaryKey: ['post_id'],
    },
  },
})

export const similarNamesSchema = createSchema({
  tables: {
    user: {
      columns: {
        user_id: { type: 'INTEGER', notNull: true },
        email_address: { type: 'VARCHAR(255)', notNull: true },
      },
      primaryKey: ['user_id'],
    },
    post: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        post_title: { type: 'VARCHAR(200)', notNull: true },
      },
      primaryKey: ['id'],
    },
  },
})

export const customerSchema = createSchema({
  tables: {
    customer: {
      columns: {
        customer_id: { type: 'INTEGER', notNull: true },
        first_name: { type: 'VARCHAR(50)', notNull: true },
        last_name: { type: 'VARCHAR(50)', notNull: true },
        email: { type: 'VARCHAR(255)', notNull: true },
      },
      primaryKey: ['customer_id'],
    },
  },
})

export const customerSimilarSchema = createSchema({
  tables: {
    customer: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        first_name: { type: 'VARCHAR(50)', notNull: true },
        surname: { type: 'VARCHAR(50)', notNull: true },
        email_address: { type: 'VARCHAR(255)', notNull: true },
      },
      primaryKey: ['id'],
    },
  },
})

export const userPostWithForeignKeySchema = createSchema({
  tables: {
    users: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
    },
    posts: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        user_id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
      foreignKeys: [
        {
          columns: ['user_id'],
          targetTable: 'users',
          targetColumns: ['id'],
        },
      ],
    },
  },
})

export const userPostCategoryWithForeignKeysSchema = createSchema({
  tables: {
    users: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
    },
    categories: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
    },
    posts: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        user_id: { type: 'INTEGER', notNull: true },
        category_id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
      foreignKeys: [
        {
          columns: ['user_id'],
          targetTable: 'users',
          targetColumns: ['id'],
        },
        {
          columns: ['category_id'],
          targetTable: 'categories',
          targetColumns: ['id'],
        },
      ],
    },
  },
})

export const userPostWithPartialForeignKeySchema = createSchema({
  tables: {
    users: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
    },
    categories: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
    },
    posts: {
      columns: {
        id: { type: 'INTEGER', notNull: true },
        user_id: { type: 'INTEGER', notNull: true },
        category_id: { type: 'INTEGER', notNull: true },
      },
      primaryKey: ['id'],
      foreignKeys: [
        {
          columns: ['user_id'],
          targetTable: 'users',
          targetColumns: ['id'],
        },
      ],
    },
  },
})
