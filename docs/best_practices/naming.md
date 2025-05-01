# Database Naming Conventions

Good naming conventions are essential for creating maintainable and understandable database schemas. This document outlines key naming best practices.

## General Principles

- **Be consistent**: Follow the same naming pattern throughout your entire database
- **Be descriptive**: Names should clearly indicate what the object represents
- **Be concise**: Avoid unnecessarily long names while maintaining clarity
- **Use singular for table names**: For example, `user` instead of `users`
- **Avoid reserved words**: Don't use SQL keywords as identifiers

## Table Naming

- Use singular nouns for entity tables (e.g., `customer`, `product`, `order`)
- Use the pattern `[entity]_[entity]` or `[entity]_has_[entity]` for junction tables (e.g., `order_item`, `student_course`)
- Prefix temporary or utility tables with `tmp_` or `temp_`

## Column Naming

- Use `id` as the primary key name
- Use `[table_name]_id` for foreign keys (e.g., `customer_id` in the `order` table)
- Use `is_` or `has_` prefix for boolean columns (e.g., `is_active`, `has_subscription`)
- Use `created_at` and `updated_at` for timestamp columns
- Avoid abbreviations unless they are widely understood

## Case Conventions

- **snake_case**: Preferred for most SQL databases (PostgreSQL, MySQL)
  - Example: `order_item`, `customer_address`, `is_active`
- **camelCase**: Sometimes used in applications with ORM mappings
  - Example: `orderItem`, `customerAddress`, `isActive`
- **PascalCase**: Occasionally used for table names in some systems
  - Example: `OrderItem`, `CustomerAddress`

## Prefixes and Suffixes

- Consider using prefixes to group related tables (e.g., `inv_` for inventory-related tables)
- Use suffixes to indicate table types:
  - `_view` for views
  - `_history` for audit/history tables
  - `_archive` for archived data

## Consistency with Code

- Consider how database names will map to your application code
- Ensure naming conventions align with your ORM or data access layer requirements
- Document any naming transformations between database and code
