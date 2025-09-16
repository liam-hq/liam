---
"@liam-hq/pglite-server": patch
---

Fix intermittent COMMENT ON statement parsing errors where statements were incorrectly parsed as OMMENT ON due to string boundary issues in the extractStatements method. Added comprehensive unit tests and defensive coding to handle edge cases with stmt_location pointing to whitespace characters.
