---
"@liam-hq/schema": minor
---

- ✨ Add SQLite support to the Drizzle schema parser
  - Auto-detect `drizzle-orm/sqlite-core` imports and `sqliteTable()` calls
  - Parse columns, foreign keys, indexes, and composite primary keys (array and object callback forms)
  - Map SQLite types (`integer`, `text`, `real`, `blob`, `numeric`); `text` with `{ enum }` is parsed as `text` since SQLite has no native enum type
