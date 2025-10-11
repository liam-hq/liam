---
"@liam-hq/erd-core": patch
---

- 🐛 Fix TableDetail not resetting when switching target tables in the ERD drawer
  - Remount TableDetail using a key derived from table.name to avoid stale state; wire CommandPalette to allow table-mode activation
