import {
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aSchema,
  aTable,
  aUniqueConstraint,
} from '@liam-hq/schema'
import type { SchemaProviderValue } from '../../stores'

const usersTable = aTable({
  name: 'users',
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
    email: aColumn({
      name: 'email',
      type: 'varchar',
      notNull: true,
    }),
  },
  constraints: {},
})

const postsTable = aTable({
  name: 'posts',
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
    user_id: aColumn({
      name: 'user_id',
      type: 'integer',
      notNull: true,
    }),
  },
  constraints: {},
})

export const mockCurrentSchema = aSchema({
  tables: {
    users: usersTable,
    posts: postsTable,
  },
})

export const mockPreviousSchema = aSchema({
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
        name: aColumn({
          name: 'name',
          type: 'varchar',
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
    // posts table will be "added" in diff
  },
  enums: {},
  extensions: {},
})

export const mockAddedTableSchema: SchemaProviderValue = {
  previous: mockPreviousSchema,
  current: {
    ...mockPreviousSchema,
    tables: {
      ...mockPreviousSchema.tables,
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
          posts_user_id_fkey: aForeignKeyConstraint({
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            deleteConstraint: 'CASCADE',
            updateConstraint: 'CASCADE',
          }),
        },
      }),
    },
  },
}

export const mockRemovedTableSchema: SchemaProviderValue = {
  previous: mockPreviousSchema,
  current: aSchema({
    tables: {},
    extensions: {},
  }),
}

export const mockModifiedTableSchema: SchemaProviderValue = {
  previous: mockPreviousSchema,
  current: {
    ...mockPreviousSchema,
    tables: {
      ...mockPreviousSchema.tables,
      users: aTable({
        ...mockPreviousSchema.tables['users'],
        comment: 'New user accounts table comment',
      }),
    },
  },
}

export const mockAddedColumnSchema: SchemaProviderValue = {
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
            comment: 'Newly added email column',
          }),
          phone: aColumn({
            name: 'phone',
            type: 'varchar',
            comment: 'Another newly added column',
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
  }),
}

export const mockRemovedColumnSchema: SchemaProviderValue = {
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
            comment: 'This column will be removed',
          }),
          phone: aColumn({
            name: 'phone',
            type: 'varchar',
            comment: 'This column will also be removed',
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
  }),
}

export const mockModifiedColumnTypeSchema: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          name: aColumn({
            name: 'name',
            type: 'text',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar(255)',
            notNull: true,
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
  }),
}

export const mockModifiedColumnCommentSchema: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'integer',
            notNull: true,
            comment: 'Updated primary key comment',
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
            comment: 'Updated user name comment',
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
            comment: 'Updated email address comment',
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
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
            comment: 'Original primary key comment',
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
            comment: 'Original user name comment',
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
            comment: 'Original email address comment',
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
  }),
}

export const mockModifiedColumnDefaultSchema: SchemaProviderValue = {
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
            default: "'Anonymous'",
          }),
          active: aColumn({
            name: 'active',
            type: 'boolean',
            notNull: true,
            default: 'true',
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
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
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
            default: "'Unknown'",
          }),
          active: aColumn({
            name: 'active',
            type: 'boolean',
            notNull: true,
            default: 'false',
          }),
        },
        constraints: {},
      }),
    },
    enums: {},
  }),
}

const usersTableWithIndexColumns = aTable({
  name: 'users',
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
    email: aColumn({
      name: 'email',
      type: 'varchar',
      notNull: true,
    }),
    created_at: aColumn({
      name: 'created_at',
      type: 'timestamp',
      notNull: true,
      default: 'CURRENT_TIMESTAMP',
    }),
  },
  constraints: {},
})

export const mockAddedIndex: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: true,
          }),
          idx_users_name: anIndex({
            name: 'idx_users_name',
            columns: ['name'],
            unique: false,
          }),
          idx_users_created_at: anIndex({
            name: 'idx_users_created_at',
            columns: ['created_at'],
            unique: false,
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: true,
          }),
        },
      }),
    },
    enums: {},
  }),
}

export const mockRemovedIndex: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: true,
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: true,
          }),
          idx_users_name: anIndex({
            name: 'idx_users_name',
            columns: ['name'],
            unique: false,
          }),
          idx_users_created_at: anIndex({
            name: 'idx_users_created_at',
            columns: ['created_at'],
            unique: false,
          }),
        },
      }),
    },
    enums: {},
  }),
}

export const mockModifiedIndexUnique: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: true,
          }),
          idx_users_name: anIndex({
            name: 'idx_users_name',
            columns: ['name'],
            unique: true,
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: true,
          }),
          idx_users_name: anIndex({
            name: 'idx_users_name',
            columns: ['name'],
            unique: false,
          }),
        },
      }),
    },
    enums: {},
  }),
}

export const mockModifiedIndexColumns: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_composite: anIndex({
            name: 'idx_users_composite',
            columns: ['name', 'email', 'created_at'],
            unique: false,
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_composite: anIndex({
            name: 'idx_users_composite',
            columns: ['name', 'email'],
            unique: false,
          }),
        },
      }),
    },
    enums: {},
  }),
}

export const mockModifiedIndexType: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: false,
            type: 'hash',
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        ...usersTableWithIndexColumns,
        indexes: {
          idx_users_email: anIndex({
            name: 'idx_users_email',
            columns: ['email'],
            unique: false,
            type: 'btree',
          }),
        },
      }),
    },
    enums: {},
  }),
}

export const mockAddedForeignKeyConstraint: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: usersTable,
      posts: aTable({
        ...postsTable,
        constraints: {
          ...postsTable.constraints,
          posts_user_id_fkey: aForeignKeyConstraint({
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            deleteConstraint: 'CASCADE',
            updateConstraint: 'CASCADE',
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: usersTable,
      posts: postsTable,
    },
    enums: {},
  }),
}

export const mockAddedUniqueConstraint: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: aTable({
        ...usersTable,
        constraints: {
          ...usersTable.constraints,
          users_email_unique: aUniqueConstraint({
            name: 'users_email_unique',
            columnNames: ['email'],
          }),
          users_name_unique: aUniqueConstraint({
            name: 'users_name_unique',
            columnNames: ['name'],
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: usersTable,
    },
    enums: {},
  }),
}

export const mockRemovedConstraint: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: usersTable,
      posts: postsTable,
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: aTable({
        ...usersTable,
        constraints: {
          ...usersTable.constraints,
          users_email_unique: aUniqueConstraint({
            name: 'users_email_unique',
            columnNames: ['email'],
          }),
        },
      }),
      posts: aTable({
        ...postsTable,
        constraints: {
          ...postsTable.constraints,
          posts_user_id_fkey: aForeignKeyConstraint({
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
          }),
        },
      }),
    },
    enums: {},
  }),
}

export const mockModifiedForeignKeyConstraint: SchemaProviderValue = {
  current: aSchema({
    tables: {
      users: usersTable,
      posts: aTable({
        ...postsTable,
        constraints: {
          ...postsTable.constraints,
          posts_user_id_fkey: aForeignKeyConstraint({
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            deleteConstraint: 'CASCADE',
            updateConstraint: 'RESTRICT',
          }),
        },
      }),
    },
    enums: {},
  }),
  previous: aSchema({
    tables: {
      users: usersTable,
      posts: aTable({
        ...postsTable,
        constraints: {
          ...postsTable.constraints,
          posts_user_id_fkey: aForeignKeyConstraint({
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            deleteConstraint: 'SET_NULL',
            updateConstraint: 'CASCADE',
          }),
        },
      }),
    },
    enums: {},
  }),
}
