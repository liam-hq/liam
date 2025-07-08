import { pgTable, integer, text, primaryKey } from 'drizzle-orm/pg-core';

export const userRoles = pgTable(
  'user_roles',
  {
    userId: integer('user_id').notNull(),
    roleId: integer('role_id').notNull(),
  },
  (table) => ({
    pk: primaryKey(table.userId, table.roleId),
  })
);
