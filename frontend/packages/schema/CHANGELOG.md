# @liam-hq/schema

## 0.5.4

### Patch Changes

- [#3354](https://github.com/liam-hq/liam/pull/3354) - publish package because dependent from schema package / Thanks [@MH4GF](https://github.com/MH4GF)!

## 0.5.3

### Patch Changes

- [#3314](https://github.com/liam-hq/liam/pull/3314) - Optimize published content by adding files field to exclude development files while maintaining TypeScript direct publishing / Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)!

## 0.5.2

### Patch Changes

- [#3118](https://github.com/liam-hq/liam/pull/3118) - 🐛 Fix PostgreSQL CHECK constraint parsing issue that could cause incorrect parsing of constraint conditions / Thanks [@FunamaYukina](https://github.com/FunamaYukina)!

## 0.5.1

### Patch Changes

- [#3105](https://github.com/liam-hq/liam/pull/3105) - 🐛 Fix ERD display failure with PostgreSQL 16.10+ pg_dump outputs / Thanks [@FunamaYukina](https://github.com/FunamaYukina)!

## 0.5.0

### Minor Changes

- [#2897](https://github.com/liam-hq/liam/pull/2897) - - 💥 Rename package from @liam-hq/db-structure to @liam-hq/schema / Thanks [@devin-ai-integration](https://github.com/apps/devin-ai-integration)!
  - Package name changed for better clarity and consistency
  - Directory structure updated from `frontend/packages/db-structure/` to `frontend/packages/schema/`
  - All import statements updated from `@liam-hq/db-structure` to `@liam-hq/schema`

## 0.4.4

### Patch Changes

- [#2642](https://github.com/liam-hq/liam/pull/2642) - ✨ Add MySQL support to Drizzle schema parser / Thanks [@FunamaYukina](https://github.com/FunamaYukina)!
- [#2556](https://github.com/liam-hq/liam/pull/2556) - ♻️ Refactor drizzle parser directory structure to support multiple databases / Thanks [@FunamaYukina](https://github.com/FunamaYukina)!
- [#2527](https://github.com/liam-hq/liam/pull/2527) - Add composite foreign key support / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!

- Change FK schema to use arrays for column names
- Update all parsers to handle composite FKs
- Create multiple edges (one per column pair) in ERD
- Fix missing link icons on composite FK columns

Note: UI representation is still under development, but link icon display has been improved.

## 0.4.3

### Patch Changes

- [#2444](https://github.com/liam-hq/liam/pull/2444) - ✨ Add support for multiple PostgreSQL schemas in Drizzle parser with proper FK resolution / Thanks [@FunamaYukina](https://github.com/FunamaYukina)!

## 0.4.2

### Patch Changes

- [#2421](https://github.com/liam-hq/liam/pull/2421) - - ✨️ Fix composite primary key and unique constraint handling in PostgreSQL and tbls parsers / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!
  - **Change**: PRIMARY KEY and UNIQUE constraints now use `columnNames: string[]` instead of `columnName: string`
  - **PostgreSQL parser**: Fixed bug where composite primary keys were incorrectly split into separate constraints (Issue #2260)
  - **tbls parser**: Fixed handling of composite constraints to use array format
  - **UI improvements**: Constraint details now display multiple columns as comma-separated values
  - **Known limitation**: Diff detection currently only checks the first column in composite constraints (TODO added)
  - This change ensures composite primary keys like `PRIMARY KEY (user_id, role_id)` are correctly represented as a single constraint with multiple columns, rather than being split into separate constraints.

## 0.4.1

### Patch Changes

- [#2299](https://github.com/liam-hq/liam/pull/2299) - ✨ [Experimental]Add Drizzle ORM schema parser support / Thanks [@FunamaYukina](https://github.com/FunamaYukina)!

## 0.4.0

### Minor Changes

- [#2396](https://github.com/liam-hq/liam/pull/2396) - 🐛 Fix PostgreSQL parser foreign key resolution in chunked processing / Thanks [@MH4GF](https://github.com/MH4GF)!

- Fix foreign key constraint resolution when processing large schema files in chunks
- Ensure table lookup context is preserved across chunk boundaries
- Add comprehensive test coverage for chunked processing scenarios
- Improve table lookup logic in PostgreSQL converter

## 0.3.0

### Minor Changes

- [#2235](https://github.com/liam-hq/liam/pull/2235) - ✨ Add support for Rails inline index syntax in schema.rb parser / Thanks [@MH4GF](https://github.com/MH4GF)!

- Support inline index declarations on columns: `t.string "name", index: true`
- Handle unique inline indexes: `t.text "mention", index: { unique: true }`
- Parse custom index names: `t.string "slug", index: { name: "custom_name" }`
- Support index types: `t.string "email", index: { using: "gin" }`

## 0.2.0

### Minor Changes

- [#2258](https://github.com/liam-hq/liam/pull/2258) - feat: add support for table-level primary key constraints in PostgreSQL parser / Thanks [@MH4GF](https://github.com/MH4GF)!

### Patch Changes

- [#2164](https://github.com/liam-hq/liam/pull/2164) - 🐛 fix(nextjs) hydration error with Next.js NuqsAdapter / Thanks [@tnyo43](https://github.com/tnyo43)!
- [#2156](https://github.com/liam-hq/liam/pull/2156) - 🐛 Fix ONE_TO_ONE relationships incorrectly showing as ONE_TO_MANY when using `--format=schemarb` with UNIQUE constraints / Thanks [@MH4GF](https://github.com/MH4GF)!

## 0.1.0

### Minor Changes

- [#1590](https://github.com/liam-hq/liam/pull/1590) - update the primsa parser to support the @@map / Thanks [@khiroshi-win](https://github.com/khiroshi-win)!

### Patch Changes

- [#1760](https://github.com/liam-hq/liam/pull/1760) - ✨ Support `check_constraint` syntax in `create_table` of Schema.rb parser / Thanks [@tnyo43](https://github.com/tnyo43)!

## 0.0.20

### Patch Changes

- [#1587](https://github.com/liam-hq/liam/pull/1587) - ✨ Enhance the postgresql parser to support Constraints / Thanks [@tnyo43](https://github.com/tnyo43)!
- [#1408](https://github.com/liam-hq/liam/pull/1408) - ✨ Enhance the schema.rb parser to support Constraints / Thanks [@tnyo43](https://github.com/tnyo43)!

## 0.0.19

### Patch Changes

- [#1329](https://github.com/liam-hq/liam/pull/1329) - ✨ add Constraints section in TableDetail / Thanks [@tnyo43](https://github.com/tnyo43)!
- [#1386](https://github.com/liam-hq/liam/pull/1386) - ✨ enhance the Prisma parser to support Constraints / Thanks [@tnyo43](https://github.com/tnyo43)!
- [#1255](https://github.com/liam-hq/liam/pull/1255) - ✨feat(Prisma): support for many_to_many relationship / Thanks [@prakha](https://github.com/prakha)!
- [#1221](https://github.com/liam-hq/liam/pull/1221) - Update dependency @ruby/prism to v1.4.0 / Thanks [@renovate](https://github.com/apps/renovate)!

## 0.0.18

### Patch Changes

- [#1168](https://github.com/liam-hq/liam/pull/1168) - ✨ feat: enhance schema to adopt constraints data / Thanks [@tnyo43](https://github.com/tnyo43)!

## 0.0.17

### Patch Changes

- [#1037](https://github.com/liam-hq/liam/pull/1037) - ✨ Adding type to indexes / Thanks [@ya2s](https://github.com/ya2s)!

## 0.0.16

### Patch Changes

- [#957](https://github.com/liam-hq/liam/pull/957) - 🐛 Enhance tests for long SQL statements and fix errorOffset handling. ref. https://github.com/liam-hq/liam/issues/874 / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!

## 0.0.15

### Patch Changes

- [#819](https://github.com/liam-hq/liam/pull/819) - 🔧 fix: update vite and fumadocs-mdx to latest versions / Thanks [@NoritakaIkeda](https://github.com/NoritakaIkeda)!

## 0.0.14

### Patch Changes

- [#699](https://github.com/liam-hq/liam/pull/699) - ♻️ Refactor SQL chunk processing to reduce memory errors. / Thanks [@hoshinotsuyoshi](https://github.com/hoshinotsuyoshi)!

Increases the likelihood of processing larger `.sql` files without encountering memory errors.

- [#767](https://github.com/liam-hq/liam/pull/767) - ✨ Support field name mapping with @map in Prisma / Thanks [@tnyo43](https://github.com/tnyo43)!

## 0.0.13

### Patch Changes

- [#696](https://github.com/liam-hq/liam/pull/696) - 🐛 Version bump failed, re-run / Thanks [@MH4GF](https://github.com/MH4GF)!

## 0.0.12

### Patch Changes

- 70741a0: ✨ Add support for primary key constraints in tbls parser
- 44975cc: ✨ Add support for default values in tbls parser and tests

## 0.0.11

### Patch Changes

- 2002de6: ✨ Add initial tbls parser
- 5417568: ✨ Add support for unique column constraints in tbls parser
- 7085005: 🔧 Implement convertToPostgresColumnType function for PostgreSQL type conversion and update parser to utilize it
- cc4a49b: ✨ Support relationship cardinality parsing for tbls schema
- 971143e: 🔧 Update Prisma column types to match PostgreSQL standards
- 3dbc04c: ✨ Add JSON Schema to Zod generation for tbls schema

## 0.0.10

### Patch Changes

- e63a29d: ✨ Support index for Prisma parser
- 65194ce: ✅ Add tests for unique fields in Prisma model
- d243467: ✨ Support on delete fk constraint in Prisma parser

## 0.0.9

### Patch Changes

- 77c079a: ✨ Add support for column comments in Prisma schema
- b31ad8e: 🐛 fix: exclude model type from columns in Prisma parser
- 851e966: 🐛 Fix prisma relationship direction
- bd2a4ca: 🚸 Updated CLI help text to dynamically display supported formats
- 0fea145: ✨️ feat(db-structure): support parsing default values in Prisma schema
- 433df21: ✨ Support Prisma relationship cardinality
- 577ee06: ✨ Add support for table comments in Prisma schema

## 0.0.8

### Patch Changes

- a7ed268: ✨ Add support for Prisma format in parser
- f5ee4ea: ✨ Enhance format detection by adding support for prisma

## 0.0.7

### Patch Changes

- 1d30918: ✨ Introduce Prisma parser

## 0.0.6

### Patch Changes

- 71b6f60: 🚸 Add ErrorDisplay component for handling and displaying errors in ERDViewer

## 0.0.5

### Patch Changes

- a0a7e7e: :sparkle: Added `detectFormat` function

## 0.0.4

### Patch Changes

- a2999c5: :children_crossing: Delay the warning `ExperimentalWarning: WASI is an experimental feature and might change at any time` for prism/wasm until the actual moment prism is used.

## 0.0.3

### Patch Changes

- 8515134: :sparkles: prism's wasm URL can now be overridden
- 177ea71: :bug: Fix compatibility issue with Node.js v18 in ERD tool

## 0.0.2

### Patch Changes

- 3b9c3b4: refactor: Reduced performance degradation caused by calculations for source and target
