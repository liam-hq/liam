---
"@liam-hq/db-structure": patch
"@liam-hq/erd-core": patch
---

Add composite foreign key support

- Change FK schema to use arrays for column names
- Update all parsers to handle composite FKs
- Create multiple edges (one per column pair) in ERD
- Fix missing link icons on composite FK columns

Note: UI representation is still under development, but link icon display has been improved.
