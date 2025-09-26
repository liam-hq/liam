---
"@liam-hq/artifact": patch
---

Add SQL semicolon validation to prevent malformed JSON in saveTestcase tool

Adds regex pattern validation to dmlOperationSchema.sql field to ensure SQL statements end with semicolon. This prevents the issue where extra characters like `" } }}]} } ]}` were being appended to SQL statements, causing malformed JSON and SQL syntax errors in the saveTestcase tool.
