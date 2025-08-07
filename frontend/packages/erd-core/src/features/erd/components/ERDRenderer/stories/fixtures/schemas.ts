import {
  aColumn,
  aForeignKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
  buildSchemaDiff,
  type Schema,
} from '@liam-hq/schema'

export const basicSchema = aSchema({
  tables: {
    users: aTable({
      name: 'users',
      comment: 'User accounts table',
      columns: {
        id: aColumn({
          name: 'id',
          type: 'integer',
          notNull: true,
          comment: 'Primary key',
        }),
        email: aColumn({
          name: 'email',
          type: 'varchar',
          notNull: true,
          comment: 'User email address',
        }),
        name: aColumn({
          name: 'name',
          type: 'varchar',
          notNull: true,
          comment: 'Full name',
        }),
        created_at: aColumn({
          name: 'created_at',
          type: 'timestamp',
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      },
      constraints: {
        users_pkey: {
          type: 'PRIMARY KEY',
          name: 'users_pkey',
          columnNames: ['id'],
        },
      },
      indexes: {
        users_email_idx: {
          name: 'users_email_idx',
          columns: ['email'],
          unique: true,
          type: 'btree',
        },
      },
    }),
    posts: aTable({
      name: 'posts',
      comment: 'Blog posts table',
      columns: {
        id: aColumn({
          name: 'id',
          type: 'integer',
          notNull: true,
          comment: 'Primary key',
        }),
        title: aColumn({
          name: 'title',
          type: 'varchar',
          notNull: true,
          comment: 'Post title',
        }),
        content: aColumn({
          name: 'content',
          type: 'text',
          comment: 'Post content',
        }),
        user_id: aColumn({
          name: 'user_id',
          type: 'integer',
          notNull: true,
          comment: 'Author user ID',
        }),
        published: aColumn({
          name: 'published',
          type: 'boolean',
          notNull: true,
          default: 'false',
        }),
        created_at: aColumn({
          name: 'created_at',
          type: 'timestamp',
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      },
      constraints: {
        posts_pkey: {
          type: 'PRIMARY KEY',
          name: 'posts_pkey',
          columnNames: ['id'],
        },
        posts_user_id_fkey: aForeignKeyConstraint({
          name: 'posts_user_id_fkey',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
        }),
      },
      indexes: {
        posts_user_id_idx: {
          name: 'posts_user_id_idx',
          columns: ['user_id'],
          unique: false,
          type: 'btree',
        },
        posts_title_idx: {
          name: 'posts_title_idx',
          columns: ['title'],
          unique: false,
          type: 'btree',
        },
      },
    }),
  },
})

export const currentSchemaForDiff = aSchema({
  tables: {
    users: aTable({
      name: 'users',
      comment: 'User accounts table',
      columns: {
        id: aColumn({
          name: 'id',
          type: 'integer',
          notNull: true,
          comment: 'Primary key',
        }),
        email: aColumn({
          name: 'email',
          type: 'varchar',
          notNull: true,
          comment: 'User email address',
        }),
        name: aColumn({
          name: 'name',
          type: 'varchar',
          notNull: true,
          comment: 'Full name',
        }),
        created_at: aColumn({
          name: 'created_at',
          type: 'timestamp',
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      },
      constraints: {
        users_pkey: {
          type: 'PRIMARY KEY',
          name: 'users_pkey',
          columnNames: ['id'],
        },
      },
      indexes: {
        users_email_idx: {
          name: 'users_email_idx',
          columns: ['email'],
          unique: true,
          type: 'btree',
        },
      },
    }),
    posts: aTable({
      name: 'posts',
      comment: 'Blog posts table',
      columns: {
        id: aColumn({
          name: 'id',
          type: 'integer',
          notNull: true,
          comment: 'Primary key',
        }),
        title: aColumn({
          name: 'title',
          type: 'varchar',
          notNull: true,
          comment: 'Post title',
        }),
        content: aColumn({
          name: 'content',
          type: 'text',
          comment: 'Post content',
        }),
        user_id: aColumn({
          name: 'user_id',
          type: 'integer',
          notNull: true,
          comment: 'Author user ID',
        }),
        published: aColumn({
          name: 'published',
          type: 'boolean',
          notNull: true,
          default: 'false',
        }),
        created_at: aColumn({
          name: 'created_at',
          type: 'timestamp',
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      },
      constraints: {
        posts_pkey: {
          type: 'PRIMARY KEY',
          name: 'posts_pkey',
          columnNames: ['id'],
        },
        posts_user_id_fkey: aForeignKeyConstraint({
          name: 'posts_user_id_fkey',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
        }),
      },
      indexes: {
        posts_user_id_idx: {
          name: 'posts_user_id_idx',
          columns: ['user_id'],
          unique: false,
          type: 'btree',
        },
        posts_title_idx: {
          name: 'posts_title_idx',
          columns: ['title'],
          unique: false,
          type: 'btree',
        },
      },
    }),
  },
})

export const previousSchemaForDiff = aSchema({
  tables: {
    users: aTable({
      name: 'users',
      comment: 'User accounts table - old comment',
      columns: {
        id: aColumn({
          name: 'id',
          type: 'integer',
          notNull: true,
          comment: 'Primary key',
        }),
        email: aColumn({
          name: 'email',
          type: 'varchar',
          notNull: true,
          comment: 'User email address',
        }),
        username: aColumn({
          name: 'username',
          type: 'varchar',
          notNull: true,
          comment: 'Username (to be removed)',
        }),
        created_at: aColumn({
          name: 'created_at',
          type: 'timestamp',
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      },
      indexes: {
        users_email_idx: {
          name: 'users_email_idx',
          columns: ['email'],
          unique: true,
          type: 'btree',
        },
        users_username_idx: {
          name: 'users_username_idx',
          columns: ['username'],
          unique: true,
          type: 'btree',
        },
      },
    }),
    posts: aTable({
      name: 'posts',
      comment: 'Blog posts table',
      columns: {
        id: aColumn({
          name: 'id',
          type: 'integer',
          notNull: true,
          comment: 'Primary key',
        }),
        title: aColumn({
          name: 'title',
          type: 'text',
          notNull: true,
          comment: 'Post title - old type',
        }),
        content: aColumn({
          name: 'content',
          type: 'text',
          comment: 'Post content',
        }),
        user_id: aColumn({
          name: 'user_id',
          type: 'integer',
          notNull: true,
          comment: 'Author user ID',
        }),
        created_at: aColumn({
          name: 'created_at',
          type: 'timestamp',
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      },
      constraints: {
        posts_user_id_fkey: aForeignKeyConstraint({
          name: 'posts_user_id_fkey',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
        }),
      },
      indexes: {
        posts_user_id_idx: {
          name: 'posts_user_id_idx',
          columns: ['user_id'],
          unique: false,
          type: 'btree',
        },
      },
    }),
  },
})

export const tableDiffSchema = {
  current: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        comment: 'Updated user accounts table',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
        },
      }),
      posts: aTable({
        name: 'posts',
        comment: 'Blog posts table',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          title: aColumn({
            name: 'title',
            type: 'varchar',
            notNull: true,
          }),
        },
      }),
      comments: aTable({
        name: 'comments',
        comment: 'New comments table',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          content: aColumn({
            name: 'content',
            type: 'text',
            notNull: true,
          }),
        },
      }),
    },
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        comment: 'User accounts table',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
        },
      }),
      posts: aTable({
        name: 'posts',
        comment: 'Blog posts table',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          title: aColumn({
            name: 'title',
            type: 'varchar',
            notNull: true,
          }),
        },
      }),
      categories: aTable({
        name: 'categories',
        comment: 'Categories table to be removed',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
      }),
    },
  }),
}

export const columnDiffSchema = {
  current: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
            comment: 'Primary key',
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
            comment: 'Updated email comment',
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
            comment: 'Full name - new column',
          }),
          age: aColumn({
            name: 'age',
            type: 'integer',
            notNull: false,
            comment: 'User age - added column',
          }),
        },
      }),
    },
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
            comment: 'Primary key',
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
            comment: 'User email address',
          }),
          username: aColumn({
            name: 'username',
            type: 'varchar',
            notNull: true,
            comment: 'Username - to be removed',
          }),
        },
      }),
    },
  }),
}

export const indexDiffSchema = {
  current: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
        indexes: {
          users_email_idx: {
            name: 'users_email_idx',
            columns: ['email'],
            unique: true,
            type: 'btree',
          },
          users_name_idx: {
            name: 'users_name_idx',
            columns: ['name'],
            unique: false,
            type: 'btree',
          },
          users_email_name_idx: {
            name: 'users_email_name_idx',
            columns: ['email', 'name'],
            unique: true,
            type: 'btree',
          },
        },
      }),
    },
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
        indexes: {
          users_email_idx: {
            name: 'users_email_idx',
            columns: ['email'],
            unique: false,
            type: 'btree',
          },
          users_old_idx: {
            name: 'users_old_idx',
            columns: ['name'],
            unique: false,
            type: 'btree',
          },
        },
      }),
    },
  }),
}

export const constraintDiffSchema = {
  current: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {
          users_email_unique: aUniqueConstraint({
            name: 'users_email_unique',
            columnNames: ['email'],
          }),
        },
      }),
      posts: aTable({
        name: 'posts',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          user_id: aColumn({
            name: 'user_id',
            type: 'integer',
            notNull: true,
          }),
          title: aColumn({
            name: 'title',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {
          posts_user_id_fkey: aForeignKeyConstraint({
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
          }),
          posts_title_unique: aUniqueConstraint({
            name: 'posts_title_unique',
            columnNames: ['title'],
          }),
        },
      }),
    },
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {
          users_email_unique: aUniqueConstraint({
            name: 'users_email_unique',
            columnNames: ['email'],
          }),
        },
      }),
      posts: aTable({
        name: 'posts',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
          }),
          user_id: aColumn({
            name: 'user_id',
            type: 'integer',
            notNull: true,
          }),
          title: aColumn({
            name: 'title',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {
          posts_old_fkey: aForeignKeyConstraint({
            name: 'posts_old_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
          }),
        },
      }),
    },
  }),
}

export const createDiffData = (current: Schema, previous: Schema) => {
  const diffItems = buildSchemaDiff(previous, current)
  return { current, previous, diffItems }
}

export const mockVersion = {
  version: '1.0.0',
  gitHash: 'abc123',
  envName: 'development',
  date: '2024-01-01',
  displayedOn: 'web' as const,
}
