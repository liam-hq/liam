---
"@liam-hq/agent": patch
---

feat: implement validateSchemaNode with DML validation

Implements the validateSchemaNode function in the LangGraph workflow to execute DML statements and validate database schemas. Adds QADMLValidationAgent for generating comprehensive DML statements (INSERT, UPDATE, DELETE) based on use cases and schema, and implements prepareDMLNode to generate DML statements using the new agent.