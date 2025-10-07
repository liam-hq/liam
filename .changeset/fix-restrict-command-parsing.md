---
"@liam-hq/schema": patch
---

Fix parsing error for PostgreSQL 16.10+ schema dumps containing \restrict commands. The parser now correctly handles the \restrict and \unrestrict meta-commands added by pg_dump version 16.10+ by filtering them before SQL chunking, preventing offset calculation mismatches that caused "UnexpectedCondition. lineNumber === null" errors.
