# Database Naming Conventions

Good naming conventions are essential for creating maintainable and understandable database schemas. Consistent naming makes your database more intuitive, reduces errors, and improves collaboration among team members.

## Table Naming

### General Guidelines

- **Use plural nouns** for table names (e.g., `users`, `orders`, `products`)
- **Use snake_case** (lowercase with underscores) for all database objects
- **Be descriptive but concise** - names should clearly indicate the entity's purpose
- **Avoid abbreviations** unless they are universally understood
- **Be consistent** across your entire schema

### Junction Tables

For many-to-many relationships, use a naming pattern that combines both entity names:

- `entity1_entity2` (e.g., `users_roles`, `products_categories`)
- Order alphabetically or by logical importance

### Prefixes and Suffixes

- Consider using prefixes for grouping related tables (e.g., `auth_users`, `auth_permissions`)
- Use suffixes to indicate table type:
  - `_history` for audit tables
  - `_archive` for archived data
  - `_log` for logging tables

## Column Naming

### Primary Keys

- Use `id` as the primary key name for simplicity
- For composite keys, use descriptive names that indicate the relationship

### Foreign Keys

- Name foreign keys using the pattern `entity_id` (e.g., `user_id`, `product_id`)
- This clearly indicates the relationship to the referenced table

### Common Columns

Standardize names for common columns:

- `created_at` - timestamp when the record was created
- `updated_at` - timestamp when the record was last updated
- `deleted_at` - timestamp for soft deletes (if using)
- `created_by` - user who created the record
- `updated_by` - user who last updated the record

### Boolean Columns

- Use `is_` or `has_` prefixes for boolean columns:
  - `is_active`, `is_deleted`, `is_admin`
  - `has_subscription`, `has_verified_email`

### Avoid Reserved Words

- Don't use SQL reserved words as identifiers (e.g., `order`, `user`, `group`)
- If unavoidable, use a prefix or suffix to distinguish them

## Schema Naming

- Use lowercase names for schemas
- Consider using schemas to organize tables by domain or function:
  - `public` - core application tables
  - `auth` - authentication and authorization
  - `audit` - audit logging
  - `reporting` - views and tables for reporting

## Index Naming

Use a consistent pattern for index names:

- `idx_table_column` for single-column indexes
- `idx_table_column1_column2` for multi-column indexes
- `uq_table_column` for unique constraints
- `pk_table` for primary keys (if explicitly named)
- `fk_table_reftable` for foreign keys

## Constraint Naming

- `pk_table` for primary key constraints
- `fk_table_reftable` for foreign key constraints
- `uq_table_column` for unique constraints
- `ck_table_check_description` for check constraints

## View Naming

- Use `vw_` prefix to distinguish views from tables
- Follow with a descriptive name of the data the view represents
- Example: `vw_active_users`, `vw_monthly_sales`

## Function and Procedure Naming

- Use verbs to indicate action (e.g., `get_user`, `calculate_total`)
- Use `fn_` prefix for functions and `pr_` for procedures
- Include parameter types if overloading functions

## Consistency is Key

Whatever conventions you choose, apply them consistently throughout your database. Document your naming conventions and ensure all team members follow them.

Remember that the goal of naming conventions is to make your database schema more understandable and maintainable. Good names should be self-documenting and reduce the need for comments or external documentation.
