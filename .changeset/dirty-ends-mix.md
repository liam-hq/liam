---
"@liam-hq/db-structure": patch
"@liam-hq/erd-core": patch
---

- ✨️ Fix composite primary key and unique constraint handling in PostgreSQL and tbls parsers
    - **Change**: PRIMARY KEY and UNIQUE constraints now use `columnNames: string[]` instead of `columnName: string`
    - **PostgreSQL parser**: Fixed bug where composite primary keys were incorrectly split into separate constraints (Issue #2260)
    - **tbls parser**: Fixed handling of composite constraints to use array format
    - **UI improvements**: Constraint details now display multiple columns as comma-separated values
    - **Known limitation**: Diff detection currently only checks the first column in composite constraints (TODO added)
    - This change ensures composite primary keys like `PRIMARY KEY (user_id, role_id)` are correctly represented as a single constraint with multiple columns, rather than being split into separate constraints.
