import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Command } from 'commander'

const mcpCommand = new Command('mcp').description(
  'mcp command for managing the MCP (Multi-Chain Protocol) configuration',
)

const server = new Server(
  {
    name: 'liam erd',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  },
)
const specificationText = `
To create or update \`.liam/schema-override.yml\`, follow the steps below.

If the \`.liam/schema-override.yml\` file does not yet exist in your repository, we recommend starting by creating it with the following content

\`\`\`yaml
overrides: {}
requests: []
\`\`\`

For details about Liam, please refer to the specification linked below.

--------

# Schema‑Override & Physical Schema Specifications (Draft)

> **Status:** Draft — v0.3 (2025‑05‑01)
> 
> This document captures **both** the *schema‑override* layer and the baseline *physical schema (schema.json)* format used in the **Liam** ecosystem.
>
> **New in v0.3** — proposal for **Implementation Requests**: a lightweight, commit‑traceable TODO mechanism embedded inside \`schema‑override.yml\`.

---

## 1  Purpose

The *schema‑override* mechanism allows contributors to attach rich, contextual metadata to an **existing** database schema.  
It is deliberately **non‑destructive**: **no migration or runtime behaviour** is affected.

The companion *schema.json* format standardises how the physical schema is exported so that

* override validation can cross‑check against reality (CI lint)
* downstream tools (ER viewer, diff, lineage) can consume a single canonical structure.

The new **Implementation Request** block serves as a *living TODO list* that is tightly coupled with the ER diagram and version control history.

---

## 2  Scope

| Covered by this spec                        | Out of scope                                          |
|--------------------------------------------|-------------------------------------------------------|
| Table & column comments, logical groupings | SQL migrations, constraints, indexes tuning          |
| Ad‑hoc relations not present in FK metadata| RLS / policy definitions, performance hints          |
| Physical schema baseline (tables, columns) | Runtime‑specific metadata (Row counts, statistics)    |
| Adding new tables and relationships        | Actual database schema changes                       |
| Adding new columns to existing tables      | Database migrations                                  |

---

## 3  Workflow Overview (high‑level)

\`\`\`mermaid
flowchart TD
  A[Postgres ⇢ parser] -->|export| B(schema.json)
  B -->|merge with| C(schema‑override.yml)
  C --> D[merged‑schema.json]
  D --> E[ER Viewer / Docs]
  subgraph CI
    B --> F[ajv diff‑lint]
    C --> F
  end
\`\`\`

---

## 4  Logical Override Layer — \`schema-override.yml\`

The schema override layer allows for enhancing the physical schema with additional metadata and virtual elements without modifying the actual database.

### 4.1 Structure and Components

The \`schema-override.yml\` file consists of two main sections:

1. **overrides**: Contains enhancements to the existing schema
2. **requests**: Contains proposed changes for future implementation

### 4.2 Example Schema Override

\`\`\`yaml
overrides:
  # Table groups (logical modules)
  tableGroups:
    payments:
      name: "Payments & Refunds"
      tables: [invoice, refund]
      comment: "All financial transaction tables"

  # Table‑level overrides
  tables:
    invoice:
      comment: "Issued bill for a customer order"
      columns:
        external_id:
          comment: "Reference from the billing gateway"
      # Add new columns to existing tables
      addColumns:
        created_at:
          name: "created_at"
          type: "timestamp"
          default: "now()"
          check: null
          primary: false
          unique: false
          notNull: true
          comment: "Creation timestamp"

  # Add completely new tables
  addTables:
    posts:
      name: "posts"
      comment: "Blog posts"
      columns:
        id:
          name: "id"
          type: "uuid"
          default: null
          check: null
          primary: true
          unique: true
          notNull: true
          comment: "Primary key"
        title:
          name: "title"
          type: "varchar"
          default: null
          check: null
          primary: false
          unique: false
          notNull: true
          comment: "Post title"
      indexes: {}
      constraints: {}

  # Add new relationships
  addRelationships:
    posts_users_fk:
      name: "posts_users_fk"
      primaryTableName: "users"
      primaryColumnName: "id"
      foreignTableName: "posts"
      foreignColumnName: "user_id"
      cardinality: "ONE_TO_MANY"
      updateConstraint: "CASCADE"
      deleteConstraint: "CASCADE"
\`\`\`

### 4.3 Schema Override Features

The schema override mechanism provides several key features:

1. **Table Groups**: Organize tables into logical groups for better visualization and documentation.
2. **Table & Column Comments**: Add or override comments on existing tables and columns.
3. **Add New Tables**: Define completely new tables that don't exist in the actual schema.
4. **Add New Columns**: Add new columns to existing tables.
5. **Add New Relationships**: Define relationships between tables that aren't represented by foreign keys in the database.

These features allow for enhanced documentation and visualization without affecting the actual database schema.

### 4.4 JSON Schema for Overrides (\`schema-override.schema.json\`)

\`\`\`jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema Override",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "overrides": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "tableGroups": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": ["name", "tables"],
            "additionalProperties": false,
            "properties": {
              "name": { "type": "string" },
              "tables": {
                "type": "array",
                "items": { "type": "string" },
                "minItems": 1
              },
              "comment": { "type": "string" }
            }
          }
        },
        "tables": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "comment": { "type": "string" },
              "columns": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "comment": { "type": "string" }
                  }
                }
              },
              "addColumns": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["name", "type", "primary", "unique", "notNull"],
                  "additionalProperties": false,
                  "properties": {
                    "name": { "type": "string" },
                    "type": { "type": "string" },
                    "default": { "type": ["string", "number", "boolean", "null"] },
                    "check": { "type": ["string", "null"] },
                    "primary": { "type": "boolean" },
                    "unique": { "type": "boolean" },
                    "notNull": { "type": "boolean" },
                    "comment": { "type": ["string", "null"] }
                  }
                }
              }
            }
          }
        },
        "addTables": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": ["name", "columns"],
            "additionalProperties": false,
            "properties": {
              "name": { "type": "string" },
              "comment": { "type": ["string", "null"] },
              "columns": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["name", "type", "primary", "unique", "notNull"],
                  "additionalProperties": false,
                  "properties": {
                    "name": { "type": "string" },
                    "type": { "type": "string" },
                    "default": { "type": ["string", "number", "boolean", "null"] },
                    "check": { "type": ["string", "null"] },
                    "primary": { "type": "boolean" },
                    "unique": { "type": "boolean" },
                    "notNull": { "type": "boolean" },
                    "comment": { "type": ["string", "null"] }
                  }
                }
              },
              "indexes": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["name", "columns"],
                  "properties": {
                    "name": { "type": "string" },
                    "columns": { "type": "array", "items": { "type": "string" } },
                    "unique": { "type": "boolean" }
                  }
                }
              },
              "constraints": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["type"],
                  "properties": {
                    "type": { "type": "string", "enum": ["PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"] },
                    "name": { "type": "string" },
                    "columnName": { "type": "string" },
                    "targetTableName": { "type": "string" },
                    "targetColumnName": { "type": "string" },
                    "updateConstraint": { "type": "string", "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"] },
                    "deleteConstraint": { "type": "string", "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"] },
                    "detail": { "type": "string" }
                  }
                }
              }
            }
          }
        },
        "addRelationships": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": [
              "name",
              "primaryTableName",
              "primaryColumnName",
              "foreignTableName",
              "foreignColumnName",
              "cardinality",
              "updateConstraint",
              "deleteConstraint"
            ],
            "additionalProperties": false,
            "properties": {
              "name": { "type": "string" },
              "primaryTableName": { "type": "string" },
              "primaryColumnName": { "type": "string" },
              "foreignTableName": { "type": "string" },
              "foreignColumnName": { "type": "string" },
              "cardinality": {
                "type": "string",
                "enum": ["ONE_TO_ONE", "ONE_TO_MANY"]
              },
              "updateConstraint": {
                "type": "string",
                "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"]
              },
              "deleteConstraint": {
                "type": "string",
                "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"]
              }
            }
          }
        }
      }
    },
    "requests": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "status", "createdBy", "createdAt"],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^REQ-\\d{4}-\\d{2}-\\d{2}-\\d{3}$"
          },
          "description": { "type": "string" },
          "status": {
            "type": "string",
            "enum": ["open", "in_progress", "done", "wontfix"]
          },
          "tables": {
            "type": "object",
            "properties": {
              "add": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["definition"],
                  "properties": {
                    "definition": {
                      "type": "object",
                      "required": ["name", "columns"],
                      "properties": {
                        "name": { "type": "string" },
                        "comment": { "type": ["string", "null"] },
                        "columns": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "object",
                            "required": ["name", "type", "primary", "unique", "notNull"],
                            "properties": {
                              "name": { "type": "string" },
                              "type": { "type": "string" },
                              "default": { "type": ["string", "number", "boolean", "null"] },
                              "check": { "type": ["string", "null"] },
                              "primary": { "type": "boolean" },
                              "unique": { "type": "boolean" },
                              "notNull": { "type": "boolean" },
                              "comment": { "type": ["string", "null"] }
                            }
                          }
                        },
                        "indexes": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "object",
                            "required": ["name", "columns"],
                            "properties": {
                              "name": { "type": "string" },
                              "columns": { "type": "array", "items": { "type": "string" } },
                              "unique": { "type": "boolean" }
                            }
                          }
                        },
                        "constraints": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "object",
                            "required": ["type"],
                            "properties": {
                              "type": { "type": "string", "enum": ["PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"] },
                              "name": { "type": "string" },
                              "columnName": { "type": "string" },
                              "targetTableName": { "type": "string" },
                              "targetColumnName": { "type": "string" },
                              "updateConstraint": { "type": "string", "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"] },
                              "deleteConstraint": { "type": "string", "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"] },
                              "detail": { "type": "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              "drop": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["reason"],
                  "properties": {
                    "reason": { "type": "string" }
                  }
                }
              },
              "alter": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["changes"],
                  "properties": {
                    "changes": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": ["type"],
                        "properties": {
                          "type": { 
                            "type": "string", 
                            "enum": ["rename_column", "modify_column", "add_column", "drop_column"] 
                          },
                          "from": { "type": "string" },
                          "to": { "type": "string" },
                          "column": { "type": "string" },
                          "changes": {
                            "type": "object",
                            "additionalProperties": {
                              "type": "object",
                              "properties": {
                                "from": { "type": ["string", "number", "boolean", "null"] },
                                "to": { "type": ["string", "number", "boolean", "null"] }
                              }
                            }
                          },
                          "definition": {
                            "type": "object",
                            "properties": {
                              "name": { "type": "string" },
                              "type": { "type": "string" },
                              "default": { "type": ["string", "number", "boolean", "null"] },
                              "check": { "type": ["string", "null"] },
                              "primary": { "type": "boolean" },
                              "unique": { "type": "boolean" },
                              "notNull": { "type": "boolean" },
                              "comment": { "type": ["string", "null"] }
                            }
                          },
                          "name": { "type": "string" },
                          "reason": { "type": "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "relationships": {
            "type": "object",
            "properties": {
              "add": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["definition"],
                  "properties": {
                    "definition": {
                      "type": "object",
                      "required": [
                        "name",
                        "primaryTableName",
                        "primaryColumnName",
                        "foreignTableName",
                        "foreignColumnName",
                        "cardinality",
                        "updateConstraint",
                        "deleteConstraint"
                      ],
                      "properties": {
                        "name": { "type": "string" },
                        "primaryTableName": { "type": "string" },
                        "primaryColumnName": { "type": "string" },
                        "foreignTableName": { "type": "string" },
                        "foreignColumnName": { "type": "string" },
                        "cardinality": {
                          "type": "string",
                          "enum": ["ONE_TO_ONE", "ONE_TO_MANY"]
                        },
                        "updateConstraint": {
                          "type": "string",
                          "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"]
                        },
                        "deleteConstraint": {
                          "type": "string",
                          "enum": ["CASCADE", "RESTRICT", "SET_NULL", "SET_DEFAULT", "NO_ACTION"]
                        }
                      }
                    }
                  }
                }
              },
              "drop": {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "required": ["reason"],
                  "properties": {
                    "reason": { "type": "string" }
                  }
                }
              }
            }
          },
          "createdBy": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" },
          "refs": {
            "type": "object",
            "properties": {
              "issue": { "type": ["string", "number"] },
              "commit": { "type": ["string", "null"] }
            }
          }
        }
      }
    }
  }
}
\`\`\`

---

## 5  Physical Schema Baseline — \`schema.json\`

The physical schema baseline represents the actual database structure as exported by the parser.

### 5.1 Structure and Components

The \`schema.json\` file contains the following main components:

1. **database**: Information about the database system
2. **tables**: Array of table definitions with columns, indexes, and foreign keys

### 5.2 Example Schema

\`\`\`jsonc
{
  "database": {
    "vendor": "postgres",
    "version": "15.5"
  },
  "tables": [
    {
      "name": "invoice",
      "schema": "public",
      "columns": [
        { "name": "id", "type": "uuid", "nullable": false, "primaryKey": true },
        { "name": "external_id", "type": "text", "nullable": true },
        { "name": "amount", "type": "numeric", "nullable": false, "default": "0" }
      ],
      "indexes": [
        { "name": "invoice_external_id_idx", "columns": ["external_id"], "unique": true }
      ],
      "foreignKeys": [
        {
          "name": "invoice_order_id_fkey",
          "columns": ["order_id"],
          "references": {
            "table": "order",
            "columns": ["id"],
            "onUpdate": "CASCADE",
            "onDelete": "RESTRICT"
          }
        }
      ]
    }
  ]
}
\`\`\`

### 5.3 JSON Schema for Physical Schema (\`schema.schema.json\`)

\`\`\`jsonc
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Physical Database Schema",
  "type": "object",
  "required": ["database", "tables"],
  "additionalProperties": false,
  "properties": {
    "database": {
      "type": "object",
      "required": ["vendor", "version"],
      "additionalProperties": false,
      "properties": {
        "vendor": { "type": "string", "enum": ["postgres", "mysql", "sqlite", "sqlserver"] },
        "version": { "type": "string" }
      }
    },
    "tables": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["name", "columns"],
        "additionalProperties": false,
        "properties": {
          "name": { "type": "string" },
          "schema": { "type": "string" },
          "columns": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "additionalProperties": false,
              "properties": {
                "name": { "type": "string" },
                "type": { "type": "string" },
                "nullable": { "type": "boolean" },
                "primaryKey": { "type": "boolean" },
                "default": { "type": ["string", "number", "null"] },
                "comment": { "type": "string" }
              }
            }
          },
          "indexes": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "columns"],
              "additionalProperties": false,
              "properties": {
                "name": { "type": "string" },
                "columns": { "type": "array", "items": { "type": "string" } },
                "unique": { "type": "boolean" }
              }
            }
          },
          "foreignKeys": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["columns", "references"],
              "additionalProperties": false,
              "properties": {
                "name": { "type": "string" },
                "columns": { "type": "array", "items": { "type": "string" } },
                "references": {
                  "type": "object",
                  "required": ["table", "columns"],
                  "additionalProperties": false,
                  "properties": {
                    "table": { "type": "string" },
                    "columns": { "type": "array", "items": { "type": "string" } },
                    "onUpdate": { "type": "string" },
                    "onDelete": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
\`\`\`

> **Note:** Indexes, triggers, and constraints beyond FKs are optional at v0.3. Future drafts may extend support.

### 5.4 Schema Integration

The physical schema (\`schema.json\`) and the logical override layer (\`schema-override.yml\`) are integrated as follows:

1. The parser exports the physical schema from the database as \`schema.json\`
2. The \`schema-override.yml\` file provides additional metadata and virtual elements
3. The integration process merges these two sources:
   - Comments from the override layer are applied to existing tables and columns
   - Table groups are created based on the override definitions
   - Virtual tables and relationships are added to the merged schema
   - Implementation requests are processed according to their status

This integration allows for enhanced documentation and visualization without affecting the actual database schema.

---

## 6  Next Steps

1. Improve validation for schema overrides to ensure they don't conflict with existing schema.
2. Enhance visualization of added tables and relationships in the ER diagram.
3. Add support for more complex column types and constraints.

---

## 7  Implementation Requests

The *Implementation Requests* feature provides a structured way to propose, track, and implement schema changes over time. It serves as a living TODO list that is tightly coupled with version control and the ER diagram.

### 7.1  Purpose

Implementation Requests allow contributors to:

* Document proposed schema changes directly alongside the schema definition
* Track the status of requested changes through the implementation lifecycle
* Maintain a clear history of schema evolution decisions
* Link schema changes to issues, commits, and pull requests

### 7.2  Structure

Implementation Requests are defined in the \`requests\` section of the \`schema-override.yml\` file:

\`\`\`yaml
# Current schema overrides
overrides:
  # existing overrides...

# Implementation requests for future changes
requests:
  - id: "REQ-2025-05-01-001"
    description: "Add comment functionality"
    status: "open"  # open, in_progress, done, wontfix
    tables:
      add:
        comments:
          definition:
            name: "comments"
            columns:
              id: 
                name: "id"
                type: "uuid"
                default: null
                check: null
                primary: true
                unique: true
                notNull: true
                comment: "Primary key"
              post_id:
                name: "post_id"
                type: "uuid"
                default: null
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Foreign key to posts table"
              content:
                name: "content"
                type: "text"
                default: null
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Comment content"
              created_at:
                name: "created_at"
                type: "timestamp"
                default: "now()"
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Creation timestamp"
            indexes: {}
            constraints: {}
    relationships:
      add:
        comments_posts_fk:
          definition:
            name: "comments_posts_fk"
            primaryTableName: "posts"
            primaryColumnName: "id"
            foreignTableName: "comments"
            foreignColumnName: "post_id"
            cardinality: "ONE_TO_MANY"
            updateConstraint: "CASCADE"
            deleteConstraint: "CASCADE"
    createdBy: "hoshinotsuyoshi"
    createdAt: "2025-05-01T06:45:00Z"
    refs:
      issue: "123"
      commit: null
\`\`\`

### 7.3  Request Types

Implementation Requests support various operation types:

#### 7.3.1  Table Operations

* **Add Table**: Define a new table to be created
  \`\`\`yaml
  tables:
    add:
      new_table_name:
        definition:
          # table definition
  \`\`\`

* **Drop Table**: Request removal of an existing table
  \`\`\`yaml
  tables:
    drop:
      table_to_remove:
        reason: "This table is no longer needed because..."
  \`\`\`

* **Alter Table**: Request changes to an existing table
  \`\`\`yaml
  tables:
    alter:
      existing_table:
        changes:
          - type: "rename_column"
            from: "old_name"
            to: "new_name"
            reason: "Standardizing naming conventions"
          
          - type: "modify_column"
            column: "column_name"
            changes:
              type: 
                from: "varchar(100)"
                to: "varchar(255)"
              notNull:
                from: false
                to: true
            reason: "Supporting longer values and ensuring data integrity"
          
          - type: "add_column"
            definition:
              name: "new_column"
              type: "timestamp"
              default: null
              notNull: false
              comment: "New feature data"
            reason: "Supporting new feature X"
          
          - type: "drop_column"
            name: "obsolete_column"
            reason: "No longer used after feature Y was removed"
  \`\`\`

#### 7.3.2  Relationship Operations

* **Add Relationship**: Define a new relationship between tables
  \`\`\`yaml
  relationships:
    add:
      new_relationship_name:
        definition:
          # relationship definition
  \`\`\`

* **Drop Relationship**: Request removal of a relationship
  \`\`\`yaml
  relationships:
    drop:
      relationship_to_remove:
        reason: "This relationship is no longer valid because..."
  \`\`\`

#### 7.3.3  Other Operations

Similar patterns can be applied to other schema elements:

* **Indexes**: \`indexes.add\`, \`indexes.drop\`, \`indexes.alter\`
* **Constraints**: \`constraints.add\`, \`constraints.drop\`, \`constraints.alter\`

### 7.4  Request Lifecycle

| Status | Description | Visualization |
|--------|-------------|---------------|
| \`open\` | Proposed change that hasn't been implemented | Displayed with "TODO" badge in ER diagram |
| \`in_progress\` | Change is being implemented | Displayed with "In Progress" badge |
| \`done\` | Change has been implemented | No badge, change is reflected in schema |
| \`wontfix\` | Change was rejected or is no longer needed | Not displayed |

### 7.5  CI Integration

Implementation Requests can be integrated with CI pipelines:

1. **Validation**: Ensure requests follow the correct format
2. **Status Tracking**: Automatically update request status based on commits
3. **Consistency Checks**: Verify that \`done\` requests match actual schema changes
4. **Stale Request Detection**: Flag \`in_progress\` requests that haven't been updated

### 7.6  Complete Schema Example

Below is a complete example of a \`schema-override.yml\` file that includes both overrides and implementation requests:

\`\`\`yaml
# Schema overrides for existing database
overrides:
  # Table groups for logical organization
  tableGroups:
    GitHub:
      name: "GitHub Integration"
      tables:
        - github_repositories
        - github_pull_requests
        - github_pull_request_comments
      comment: "Tables related to GitHub integration"
    
    Organization:
      name: "Organization Management"
      tables:
        - organizations
        - organization_members
        - users
      comment: "Tables for managing organizations and users"
  
  # Table-level overrides
  tables:
    github_repositories:
      comment: "GitHub repositories with metadata"
      columns:
        github_repository_identifier:
          comment: "GitHub's repository ID from their API"
    
    users:
      comment: "User accounts and authentication information"
      columns:
        email:
          comment: "Primary email address for notifications"
        created_at:
          comment: "Account creation timestamp"
      
      # Add new columns to existing tables
      addColumns:
        last_login:
          name: "last_login"
          type: "timestamp"
          default: null
          check: null
          primary: false
          unique: false
          notNull: false
          comment: "Last successful login timestamp"
  
  # Add completely new tables
  addTables:
    documentation:
      name: "documentation"
      comment: "Documentation resources for repositories"
      columns:
        id:
          name: "id"
          type: "uuid"
          default: null
          check: null
          primary: true
          unique: true
          notNull: true
          comment: "Primary key"
        repository_id:
          name: "repository_id"
          type: "uuid"
          default: null
          check: null
          primary: false
          unique: false
          notNull: true
          comment: "Foreign key to github_repositories"
        title:
          name: "title"
          type: "varchar"
          default: null
          check: null
          primary: false
          unique: false
          notNull: true
          comment: "Documentation title"
        content:
          name: "content"
          type: "text"
          default: null
          check: null
          primary: false
          unique: false
          notNull: true
          comment: "Documentation content"
      indexes: {}
      constraints: {}
  
  # Add new relationships
  addRelationships:
    documentation_repository_fk:
      name: "documentation_repository_fk"
      primaryTableName: "github_repositories"
      primaryColumnName: "id"
      foreignTableName: "documentation"
      foreignColumnName: "repository_id"
      cardinality: "ONE_TO_MANY"
      updateConstraint: "CASCADE"
      deleteConstraint: "CASCADE"

# Implementation requests for future changes
requests:
  - id: "REQ-2025-05-01-001"
    description: "Add analytics tracking for repositories"
    status: "open"
    tables:
      add:
        repository_analytics:
          definition:
            name: "repository_analytics"
            columns:
              id:
                name: "id"
                type: "uuid"
                default: null
                check: null
                primary: true
                unique: true
                notNull: true
                comment: "Primary key"
              repository_id:
                name: "repository_id"
                type: "uuid"
                default: null
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Foreign key to github_repositories"
              views_count:
                name: "views_count"
                type: "integer"
                default: "0"
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Number of repository views"
              clones_count:
                name: "clones_count"
                type: "integer"
                default: "0"
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Number of repository clones"
              last_updated:
                name: "last_updated"
                type: "timestamp"
                default: "now()"
                check: null
                primary: false
                unique: false
                notNull: true
                comment: "Last update timestamp"
            indexes: {}
            constraints: {}
    relationships:
      add:
        analytics_repository_fk:
          definition:
            name: "analytics_repository_fk"
            primaryTableName: "github_repositories"
            primaryColumnName: "id"
            foreignTableName: "repository_analytics"
            foreignColumnName: "repository_id"
            cardinality: "ONE_TO_ONE"
            updateConstraint: "CASCADE"
            deleteConstraint: "CASCADE"
    createdBy: "hoshinotsuyoshi"
    createdAt: "2025-05-01T06:50:00Z"
    refs:
      issue: "456"
      commit: null

  - id: "REQ-2025-05-01-002"
    description: "Improve user table with additional fields"
    status: "in_progress"
    tables:
      alter:
        users:
          changes:
            - type: "add_column"
              definition:
                name: "last_login"
                type: "timestamp"
                default: null
                notNull: false
                comment: "User's last login timestamp"
              reason: "Track user activity for security monitoring"
            
            - type: "add_column"
              definition:
                name: "login_count"
                type: "integer"
                default: "0"
                notNull: true
                comment: "Number of times user has logged in"
              reason: "Track user engagement metrics"
            
            - type: "modify_column"
              column: "email"
              changes:
                type:
                  from: "varchar(100)"
                  to: "varchar(255)"
              reason: "Support longer email addresses"
    createdBy: "hoshinotsuyoshi"
    createdAt: "2025-05-01T06:51:00Z"
    refs:
      issue: "457"
      commit: null

  - id: "REQ-2025-05-01-003"
    description: "Remove legacy notification system"
    status: "open"
    tables:
      drop:
        legacy_notifications:
          reason: "This table is no longer needed as we've migrated to the new notification system"
    relationships:
      drop:
        legacy_notification_user_fk:
          reason: "Relationship is no longer needed as the legacy_notifications table will be removed"
    createdBy: "hoshinotsuyoshi"
    createdAt: "2025-05-01T06:52:00Z"
    refs:
      issue: "458"
      commit: null
\`\`\`

---

*End of Draft v0.3*

`

// TODO: implement
const schemaJson = `
{
  "tables": {
    "Account": {
      "name": "Account",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "type": {
          "name": "type",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "provider": {
          "name": "provider",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "providerAccountId": {
          "name": "providerAccountId",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "refresh_token": {
          "name": "refresh_token",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "access_token": {
          "name": "access_token",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expires_at": {
          "name": "expires_at",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expires_in": {
          "name": "expires_in",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "ext_expires_in": {
          "name": "ext_expires_in",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "token_type": {
          "name": "token_type",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "scope": {
          "name": "scope",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "id_token": {
          "name": "id_token",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "session_state": {
          "name": "session_state",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "refresh_token_expires_in": {
          "name": "refresh_token_expires_in",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Account_pkey": {
          "name": "Account_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Account_user_id_idx": {
          "name": "Account_user_id_idx",
          "unique": false,
          "columns": [
            "user_id"
          ],
          "type": ""
        },
        "Account_provider_providerAccountId_key": {
          "name": "Account_provider_providerAccountId_key",
          "unique": true,
          "columns": [
            "provider",
            "providerAccountId"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "AccountToUser": {
          "type": "FOREIGN KEY",
          "name": "AccountToUser",
          "columnName": "user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "NO_ACTION"
        }
      }
    },
    "Session": {
      "name": "Session",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "session_token": {
          "name": "session_token",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expires": {
          "name": "expires",
          "type": "timestamp(3)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Session_pkey": {
          "name": "Session_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Session_session_token_key": {
          "name": "Session_session_token_key",
          "unique": true,
          "columns": [
            "session_token"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "UNIQUE_session_token": {
          "type": "UNIQUE",
          "name": "UNIQUE_session_token",
          "columnName": "session_token"
        },
        "SessionToUser": {
          "type": "FOREIGN KEY",
          "name": "SessionToUser",
          "columnName": "user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "NO_ACTION"
        }
      }
    },
    "User": {
      "name": "User",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "email": {
          "name": "email",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "email_verified": {
          "name": "email_verified",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "password": {
          "name": "password",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "image": {
          "name": "image",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "admin": {
          "name": "admin",
          "type": "boolean",
          "default": false,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "feature_flags": {
          "name": "feature_flags",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "User_pkey": {
          "name": "User_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "User_email_key": {
          "name": "User_email_key",
          "unique": true,
          "columns": [
            "email"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "UNIQUE_email": {
          "type": "UNIQUE",
          "name": "UNIQUE_email",
          "columnName": "email"
        }
      }
    },
    "VerificationToken": {
      "name": "VerificationToken",
      "columns": {
        "identifier": {
          "name": "identifier",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "token": {
          "name": "token",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expires": {
          "name": "expires",
          "type": "timestamp(3)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "VerificationToken_token_key": {
          "name": "VerificationToken_token_key",
          "unique": true,
          "columns": [
            "token"
          ],
          "type": ""
        },
        "VerificationToken_identifier_token_key": {
          "name": "VerificationToken_identifier_token_key",
          "unique": true,
          "columns": [
            "identifier",
            "token"
          ],
          "type": ""
        }
      },
      "constraints": {
        "UNIQUE_token": {
          "type": "UNIQUE",
          "name": "UNIQUE_token",
          "columnName": "token"
        }
      }
    },
    "Organization": {
      "name": "Organization",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "cloud_config": {
          "name": "cloud_config",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Organization_pkey": {
          "name": "Organization_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        }
      }
    },
    "Project": {
      "name": "Project",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "org_id": {
          "name": "org_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "deleted_at": {
          "name": "deleted_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "retention_days": {
          "name": "retention_days",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Project_pkey": {
          "name": "Project_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Project_org_id_idx": {
          "name": "Project_org_id_idx",
          "unique": false,
          "columns": [
            "org_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "OrganizationToProject": {
          "type": "FOREIGN KEY",
          "name": "OrganizationToProject",
          "columnName": "org_id",
          "targetTableName": "Organization",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "ApiKey": {
      "name": "ApiKey",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "note": {
          "name": "note",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "public_key": {
          "name": "public_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "hashed_secret_key": {
          "name": "hashed_secret_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "fast_hashed_secret_key": {
          "name": "fast_hashed_secret_key",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "display_secret_key": {
          "name": "display_secret_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "last_used_at": {
          "name": "last_used_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "ApiKey_pkey": {
          "name": "ApiKey_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "ApiKey_id_key": {
          "name": "ApiKey_id_key",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "ApiKey_public_key_key": {
          "name": "ApiKey_public_key_key",
          "unique": true,
          "columns": [
            "public_key"
          ],
          "type": ""
        },
        "ApiKey_hashed_secret_key_key": {
          "name": "ApiKey_hashed_secret_key_key",
          "unique": true,
          "columns": [
            "hashed_secret_key"
          ],
          "type": ""
        },
        "ApiKey_fast_hashed_secret_key_key": {
          "name": "ApiKey_fast_hashed_secret_key_key",
          "unique": true,
          "columns": [
            "fast_hashed_secret_key"
          ],
          "type": ""
        },
        "ApiKey_project_id_idx": {
          "name": "ApiKey_project_id_idx",
          "unique": false,
          "columns": [
            "project_id"
          ],
          "type": ""
        },
        "ApiKey_public_key_idx": {
          "name": "ApiKey_public_key_idx",
          "unique": false,
          "columns": [
            "public_key"
          ],
          "type": ""
        },
        "ApiKey_hashed_secret_key_idx": {
          "name": "ApiKey_hashed_secret_key_idx",
          "unique": false,
          "columns": [
            "hashed_secret_key"
          ],
          "type": ""
        },
        "ApiKey_fast_hashed_secret_key_idx": {
          "name": "ApiKey_fast_hashed_secret_key_idx",
          "unique": false,
          "columns": [
            "fast_hashed_secret_key"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "UNIQUE_public_key": {
          "type": "UNIQUE",
          "name": "UNIQUE_public_key",
          "columnName": "public_key"
        },
        "UNIQUE_hashed_secret_key": {
          "type": "UNIQUE",
          "name": "UNIQUE_hashed_secret_key",
          "columnName": "hashed_secret_key"
        },
        "UNIQUE_fast_hashed_secret_key": {
          "type": "UNIQUE",
          "name": "UNIQUE_fast_hashed_secret_key",
          "columnName": "fast_hashed_secret_key"
        },
        "ApiKeyToProject": {
          "type": "FOREIGN KEY",
          "name": "ApiKeyToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "BackgroundMigration": {
      "name": "BackgroundMigration",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": false,
          "comment": null,
          "check": null
        },
        "script": {
          "name": "script",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "args": {
          "name": "args",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "state": {
          "name": "state",
          "type": "jsonb",
          "default": "{}",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "finished_at": {
          "name": "finished_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "failed_at": {
          "name": "failed_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "failed_reason": {
          "name": "failed_reason",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "worker_id": {
          "name": "worker_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "locked_at": {
          "name": "locked_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "BackgroundMigration_pkey": {
          "name": "BackgroundMigration_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "BackgroundMigration_name_key": {
          "name": "BackgroundMigration_name_key",
          "unique": true,
          "columns": [
            "name"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "UNIQUE_name": {
          "type": "UNIQUE",
          "name": "UNIQUE_name",
          "columnName": "name"
        }
      }
    },
    "LlmApiKeys": {
      "name": "LlmApiKeys",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "provider": {
          "name": "provider",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "adapter": {
          "name": "adapter",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "display_secret_key": {
          "name": "display_secret_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "secret_key": {
          "name": "secret_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "base_url": {
          "name": "base_url",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "custom_models": {
          "name": "custom_models",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "with_default_models": {
          "name": "with_default_models",
          "type": "boolean",
          "default": true,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "extra_headers": {
          "name": "extra_headers",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "extra_header_keys": {
          "name": "extra_header_keys",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "config": {
          "name": "config",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "LlmApiKeys_pkey": {
          "name": "LlmApiKeys_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "LlmApiKeys_id_key": {
          "name": "LlmApiKeys_id_key",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "LlmApiKeys_project_id_provider_key": {
          "name": "LlmApiKeys_project_id_provider_key",
          "unique": true,
          "columns": [
            "project_id",
            "provider"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "LlmApiKeysToProject": {
          "type": "FOREIGN KEY",
          "name": "LlmApiKeysToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "OrganizationMembership": {
      "name": "OrganizationMembership",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "org_id": {
          "name": "org_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "role": {
          "name": "role",
          "type": "Role",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "OrganizationMembership_pkey": {
          "name": "OrganizationMembership_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "OrganizationMembership_user_id_idx": {
          "name": "OrganizationMembership_user_id_idx",
          "unique": false,
          "columns": [
            "user_id"
          ],
          "type": ""
        },
        "OrganizationMembership_org_id_user_id_key": {
          "name": "OrganizationMembership_org_id_user_id_key",
          "unique": true,
          "columns": [
            "org_id",
            "user_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "OrganizationToOrganizationMembership": {
          "type": "FOREIGN KEY",
          "name": "OrganizationToOrganizationMembership",
          "columnName": "org_id",
          "targetTableName": "Organization",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "OrganizationMembershipToUser": {
          "type": "FOREIGN KEY",
          "name": "OrganizationMembershipToUser",
          "columnName": "user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "ProjectMembership": {
      "name": "ProjectMembership",
      "columns": {
        "org_membership_id": {
          "name": "org_membership_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "role": {
          "name": "role",
          "type": "Role",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "ProjectMembership_pkey": {
          "name": "ProjectMembership_pkey",
          "unique": true,
          "columns": [
            "project_id",
            "user_id"
          ],
          "type": ""
        },
        "ProjectMembership_user_id_idx": {
          "name": "ProjectMembership_user_id_idx",
          "unique": false,
          "columns": [
            "user_id"
          ],
          "type": ""
        },
        "ProjectMembership_project_id_idx": {
          "name": "ProjectMembership_project_id_idx",
          "unique": false,
          "columns": [
            "project_id"
          ],
          "type": ""
        },
        "ProjectMembership_org_membership_id_idx": {
          "name": "ProjectMembership_org_membership_id_idx",
          "unique": false,
          "columns": [
            "org_membership_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "OrganizationMembershipToProjectMembership": {
          "type": "FOREIGN KEY",
          "name": "OrganizationMembershipToProjectMembership",
          "columnName": "org_membership_id",
          "targetTableName": "OrganizationMembership",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "ProjectToProjectMembership": {
          "type": "FOREIGN KEY",
          "name": "ProjectToProjectMembership",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "ProjectMembershipToUser": {
          "type": "FOREIGN KEY",
          "name": "ProjectMembershipToUser",
          "columnName": "user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "MembershipInvitation": {
      "name": "MembershipInvitation",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "email": {
          "name": "email",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "org_id": {
          "name": "org_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "org_role": {
          "name": "org_role",
          "type": "Role",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_role": {
          "name": "project_role",
          "type": "Role",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "invited_by_user_id": {
          "name": "invited_by_user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "MembershipInvitation_pkey": {
          "name": "MembershipInvitation_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "MembershipInvitation_id_key": {
          "name": "MembershipInvitation_id_key",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "MembershipInvitation_project_id_idx": {
          "name": "MembershipInvitation_project_id_idx",
          "unique": false,
          "columns": [
            "project_id"
          ],
          "type": ""
        },
        "MembershipInvitation_org_id_idx": {
          "name": "MembershipInvitation_org_id_idx",
          "unique": false,
          "columns": [
            "org_id"
          ],
          "type": ""
        },
        "MembershipInvitation_email_idx": {
          "name": "MembershipInvitation_email_idx",
          "unique": false,
          "columns": [
            "email"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "MembershipInvitationToOrganization": {
          "type": "FOREIGN KEY",
          "name": "MembershipInvitationToOrganization",
          "columnName": "org_id",
          "targetTableName": "Organization",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "MembershipInvitationToProject": {
          "type": "FOREIGN KEY",
          "name": "MembershipInvitationToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "SET_NULL"
        },
        "MembershipInvitationToUser": {
          "type": "FOREIGN KEY",
          "name": "MembershipInvitationToUser",
          "columnName": "invited_by_user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "SET_NULL"
        }
      }
    },
    "TraceSession": {
      "name": "TraceSession",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "bookmarked": {
          "name": "bookmarked",
          "type": "boolean",
          "default": false,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "public": {
          "name": "public",
          "type": "boolean",
          "default": false,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "environment": {
          "name": "environment",
          "type": "text",
          "default": "default",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "TraceSession_pkey": {
          "name": "TraceSession_pkey",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "TraceSession_project_id_idx": {
          "name": "TraceSession_project_id_idx",
          "unique": false,
          "columns": [
            "project_id"
          ],
          "type": ""
        },
        "TraceSession_created_at_idx": {
          "name": "TraceSession_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "TraceSession_updated_at_idx": {
          "name": "TraceSession_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        }
      },
      "constraints": {
        "ProjectToTraceSession": {
          "type": "FOREIGN KEY",
          "name": "ProjectToTraceSession",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "LegacyPrismaTrace": {
      "name": "LegacyPrismaTrace",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "external_id": {
          "name": "external_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "timestamp": {
          "name": "timestamp",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "release": {
          "name": "release",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "version": {
          "name": "version",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "public": {
          "name": "public",
          "type": "boolean",
          "default": false,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "bookmarked": {
          "name": "bookmarked",
          "type": "boolean",
          "default": false,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "tags": {
          "name": "tags",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "input": {
          "name": "input",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "output": {
          "name": "output",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "session_id": {
          "name": "session_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "LegacyPrismaTrace_pkey": {
          "name": "LegacyPrismaTrace_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_project_id_timestamp_idx": {
          "name": "LegacyPrismaTrace_project_id_timestamp_idx",
          "unique": false,
          "columns": [
            "project_id",
            "timestamp"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_session_id_idx": {
          "name": "LegacyPrismaTrace_session_id_idx",
          "unique": false,
          "columns": [
            "session_id"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_name_idx": {
          "name": "LegacyPrismaTrace_name_idx",
          "unique": false,
          "columns": [
            "name"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_user_id_idx": {
          "name": "LegacyPrismaTrace_user_id_idx",
          "unique": false,
          "columns": [
            "user_id"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_id_user_id_idx": {
          "name": "LegacyPrismaTrace_id_user_id_idx",
          "unique": false,
          "columns": [
            "id",
            "user_id"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_timestamp_idx": {
          "name": "LegacyPrismaTrace_timestamp_idx",
          "unique": false,
          "columns": [
            "timestamp"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_created_at_idx": {
          "name": "LegacyPrismaTrace_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "LegacyPrismaTrace_tags_idx": {
          "name": "LegacyPrismaTrace_tags_idx",
          "unique": false,
          "columns": [
            "tags"
          ],
          "type": "Gin"
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "LegacyPrismaTraceToProject": {
          "type": "FOREIGN KEY",
          "name": "LegacyPrismaTraceToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "LegacyPrismaObservation": {
      "name": "LegacyPrismaObservation",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "trace_id": {
          "name": "trace_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "type": {
          "name": "type",
          "type": "LegacyPrismaObservationType",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "start_time": {
          "name": "start_time",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "end_time": {
          "name": "end_time",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "parent_observation_id": {
          "name": "parent_observation_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "level": {
          "name": "level",
          "type": "LegacyPrismaObservationLevel",
          "default": "DEFAULT",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "status_message": {
          "name": "status_message",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "version": {
          "name": "version",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "model": {
          "name": "model",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "internal_model": {
          "name": "internal_model",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "internal_model_id": {
          "name": "internal_model_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "modelParameters": {
          "name": "modelParameters",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "input": {
          "name": "input",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "output": {
          "name": "output",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "prompt_tokens": {
          "name": "prompt_tokens",
          "type": "integer",
          "default": 0,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "completion_tokens": {
          "name": "completion_tokens",
          "type": "integer",
          "default": 0,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "total_tokens": {
          "name": "total_tokens",
          "type": "integer",
          "default": 0,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "unit": {
          "name": "unit",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "input_cost": {
          "name": "input_cost",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "output_cost": {
          "name": "output_cost",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "total_cost": {
          "name": "total_cost",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "calculated_input_cost": {
          "name": "calculated_input_cost",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "calculated_output_cost": {
          "name": "calculated_output_cost",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "calculated_total_cost": {
          "name": "calculated_total_cost",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "completion_start_time": {
          "name": "completion_start_time",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "prompt_id": {
          "name": "prompt_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "LegacyPrismaObservation_pkey": {
          "name": "LegacyPrismaObservation_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_project_id_internal_model_start_time_unit_idx": {
          "name": "LegacyPrismaObservation_project_id_internal_model_start_time_unit_idx",
          "unique": false,
          "columns": [
            "project_id",
            "internal_model",
            "start_time",
            "unit"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_trace_id_project_id_type_start_time_idx": {
          "name": "LegacyPrismaObservation_trace_id_project_id_type_start_time_idx",
          "unique": false,
          "columns": [
            "trace_id",
            "project_id",
            "type",
            "start_time"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_trace_id_project_id_start_time_idx": {
          "name": "LegacyPrismaObservation_trace_id_project_id_start_time_idx",
          "unique": false,
          "columns": [
            "trace_id",
            "project_id",
            "start_time"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_type_idx": {
          "name": "LegacyPrismaObservation_type_idx",
          "unique": false,
          "columns": [
            "type"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_start_time_idx": {
          "name": "LegacyPrismaObservation_start_time_idx",
          "unique": false,
          "columns": [
            "start_time"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_created_at_idx": {
          "name": "LegacyPrismaObservation_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_model_idx": {
          "name": "LegacyPrismaObservation_model_idx",
          "unique": false,
          "columns": [
            "model"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_internal_model_idx": {
          "name": "LegacyPrismaObservation_internal_model_idx",
          "unique": false,
          "columns": [
            "internal_model"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_project_id_prompt_id_idx": {
          "name": "LegacyPrismaObservation_project_id_prompt_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "prompt_id"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_prompt_id_idx": {
          "name": "LegacyPrismaObservation_prompt_id_idx",
          "unique": false,
          "columns": [
            "prompt_id"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_project_id_start_time_type_idx": {
          "name": "LegacyPrismaObservation_project_id_start_time_type_idx",
          "unique": false,
          "columns": [
            "project_id",
            "start_time",
            "type"
          ],
          "type": ""
        },
        "LegacyPrismaObservation_id_project_id_key": {
          "name": "LegacyPrismaObservation_id_project_id_key",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "LegacyPrismaObservationToProject": {
          "type": "FOREIGN KEY",
          "name": "LegacyPrismaObservationToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "LegacyPrismaScore": {
      "name": "LegacyPrismaScore",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "timestamp": {
          "name": "timestamp",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "value": {
          "name": "value",
          "type": "double precision",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "source": {
          "name": "source",
          "type": "LegacyPrismaScoreSource",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "author_user_id": {
          "name": "author_user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "comment": {
          "name": "comment",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "trace_id": {
          "name": "trace_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "observation_id": {
          "name": "observation_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "config_id": {
          "name": "config_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "string_value": {
          "name": "string_value",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "queue_id": {
          "name": "queue_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "data_type": {
          "name": "data_type",
          "type": "ScoreDataType",
          "default": "NUMERIC",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "LegacyPrismaScore_pkey": {
          "name": "LegacyPrismaScore_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "LegacyPrismaScore_timestamp_idx": {
          "name": "LegacyPrismaScore_timestamp_idx",
          "unique": false,
          "columns": [
            "timestamp"
          ],
          "type": ""
        },
        "LegacyPrismaScore_value_idx": {
          "name": "LegacyPrismaScore_value_idx",
          "unique": false,
          "columns": [
            "value"
          ],
          "type": ""
        },
        "LegacyPrismaScore_project_id_name_idx": {
          "name": "LegacyPrismaScore_project_id_name_idx",
          "unique": false,
          "columns": [
            "project_id",
            "name"
          ],
          "type": ""
        },
        "LegacyPrismaScore_author_user_id_idx": {
          "name": "LegacyPrismaScore_author_user_id_idx",
          "unique": false,
          "columns": [
            "author_user_id"
          ],
          "type": ""
        },
        "LegacyPrismaScore_config_id_idx": {
          "name": "LegacyPrismaScore_config_id_idx",
          "unique": false,
          "columns": [
            "config_id"
          ],
          "type": ""
        },
        "LegacyPrismaScore_trace_id_idx": {
          "name": "LegacyPrismaScore_trace_id_idx",
          "unique": false,
          "columns": [
            "trace_id"
          ],
          "type": "Hash"
        },
        "LegacyPrismaScore_observation_id_idx": {
          "name": "LegacyPrismaScore_observation_id_idx",
          "unique": false,
          "columns": [
            "observation_id"
          ],
          "type": "Hash"
        },
        "LegacyPrismaScore_source_idx": {
          "name": "LegacyPrismaScore_source_idx",
          "unique": false,
          "columns": [
            "source"
          ],
          "type": ""
        },
        "LegacyPrismaScore_created_at_idx": {
          "name": "LegacyPrismaScore_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "LegacyPrismaScore_id_project_id_key": {
          "name": "LegacyPrismaScore_id_project_id_key",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "LegacyPrismaScoreToProject": {
          "type": "FOREIGN KEY",
          "name": "LegacyPrismaScoreToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "LegacyPrismaScoreToScoreConfig": {
          "type": "FOREIGN KEY",
          "name": "LegacyPrismaScoreToScoreConfig",
          "columnName": "config_id",
          "targetTableName": "ScoreConfig",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "NO_ACTION"
        }
      }
    },
    "ScoreConfig": {
      "name": "ScoreConfig",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "data_type": {
          "name": "data_type",
          "type": "ScoreDataType",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "is_archived": {
          "name": "is_archived",
          "type": "boolean",
          "default": false,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "min_value": {
          "name": "min_value",
          "type": "double precision",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "max_value": {
          "name": "max_value",
          "type": "double precision",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "categories": {
          "name": "categories",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "description": {
          "name": "description",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "ScoreConfig_pkey": {
          "name": "ScoreConfig_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "ScoreConfig_data_type_idx": {
          "name": "ScoreConfig_data_type_idx",
          "unique": false,
          "columns": [
            "data_type"
          ],
          "type": ""
        },
        "ScoreConfig_is_archived_idx": {
          "name": "ScoreConfig_is_archived_idx",
          "unique": false,
          "columns": [
            "is_archived"
          ],
          "type": ""
        },
        "ScoreConfig_project_id_idx": {
          "name": "ScoreConfig_project_id_idx",
          "unique": false,
          "columns": [
            "project_id"
          ],
          "type": ""
        },
        "ScoreConfig_categories_idx": {
          "name": "ScoreConfig_categories_idx",
          "unique": false,
          "columns": [
            "categories"
          ],
          "type": ""
        },
        "ScoreConfig_created_at_idx": {
          "name": "ScoreConfig_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "ScoreConfig_updated_at_idx": {
          "name": "ScoreConfig_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        },
        "ScoreConfig_id_project_id_key": {
          "name": "ScoreConfig_id_project_id_key",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ProjectToScoreConfig": {
          "type": "FOREIGN KEY",
          "name": "ProjectToScoreConfig",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "AnnotationQueue": {
      "name": "AnnotationQueue",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "description": {
          "name": "description",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "score_config_ids": {
          "name": "score_config_ids",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "AnnotationQueue_pkey": {
          "name": "AnnotationQueue_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "AnnotationQueue_id_project_id_idx": {
          "name": "AnnotationQueue_id_project_id_idx",
          "unique": false,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "AnnotationQueue_project_id_created_at_idx": {
          "name": "AnnotationQueue_project_id_created_at_idx",
          "unique": false,
          "columns": [
            "project_id",
            "created_at"
          ],
          "type": ""
        },
        "AnnotationQueue_project_id_name_key": {
          "name": "AnnotationQueue_project_id_name_key",
          "unique": true,
          "columns": [
            "project_id",
            "name"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "AnnotationQueueToProject": {
          "type": "FOREIGN KEY",
          "name": "AnnotationQueueToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "AnnotationQueueItem": {
      "name": "AnnotationQueueItem",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "queue_id": {
          "name": "queue_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "object_id": {
          "name": "object_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "object_type": {
          "name": "object_type",
          "type": "AnnotationQueueObjectType",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "status": {
          "name": "status",
          "type": "AnnotationQueueStatus",
          "default": "PENDING",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "locked_at": {
          "name": "locked_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "locked_by_user_id": {
          "name": "locked_by_user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "annotator_user_id": {
          "name": "annotator_user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "completed_at": {
          "name": "completed_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "AnnotationQueueItem_pkey": {
          "name": "AnnotationQueueItem_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "AnnotationQueueItem_id_project_id_idx": {
          "name": "AnnotationQueueItem_id_project_id_idx",
          "unique": false,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "AnnotationQueueItem_project_id_queue_id_status_idx": {
          "name": "AnnotationQueueItem_project_id_queue_id_status_idx",
          "unique": false,
          "columns": [
            "project_id",
            "queue_id",
            "status"
          ],
          "type": ""
        },
        "AnnotationQueueItem_object_id_object_type_project_id_queue_id_idx": {
          "name": "AnnotationQueueItem_object_id_object_type_project_id_queue_id_idx",
          "unique": false,
          "columns": [
            "object_id",
            "object_type",
            "project_id",
            "queue_id"
          ],
          "type": ""
        },
        "AnnotationQueueItem_annotator_user_id_idx": {
          "name": "AnnotationQueueItem_annotator_user_id_idx",
          "unique": false,
          "columns": [
            "annotator_user_id"
          ],
          "type": ""
        },
        "AnnotationQueueItem_created_at_idx": {
          "name": "AnnotationQueueItem_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "AnnotationQueueToAnnotationQueueItem": {
          "type": "FOREIGN KEY",
          "name": "AnnotationQueueToAnnotationQueueItem",
          "columnName": "queue_id",
          "targetTableName": "AnnotationQueue",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "LockedByUser": {
          "type": "FOREIGN KEY",
          "name": "LockedByUser",
          "columnName": "locked_by_user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "SET_NULL"
        },
        "AnnotatorUser": {
          "type": "FOREIGN KEY",
          "name": "AnnotatorUser",
          "columnName": "annotator_user_id",
          "targetTableName": "User",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "SET_NULL"
        },
        "AnnotationQueueItemToProject": {
          "type": "FOREIGN KEY",
          "name": "AnnotationQueueItemToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "CronJobs": {
      "name": "CronJobs",
      "columns": {
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "last_run": {
          "name": "last_run",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_started_at": {
          "name": "job_started_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "state": {
          "name": "state",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "CronJobs_pkey": {
          "name": "CronJobs_pkey",
          "unique": true,
          "columns": [
            "name"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_name": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_name",
          "columnName": "name"
        }
      }
    },
    "Dataset": {
      "name": "Dataset",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "description": {
          "name": "description",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Dataset_pkey": {
          "name": "Dataset_pkey",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "Dataset_created_at_idx": {
          "name": "Dataset_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "Dataset_updated_at_idx": {
          "name": "Dataset_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        },
        "Dataset_project_id_name_key": {
          "name": "Dataset_project_id_name_key",
          "unique": true,
          "columns": [
            "project_id",
            "name"
          ],
          "type": ""
        }
      },
      "constraints": {
        "DatasetToProject": {
          "type": "FOREIGN KEY",
          "name": "DatasetToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "DatasetItem": {
      "name": "DatasetItem",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "status": {
          "name": "status",
          "type": "DatasetStatus",
          "default": "ACTIVE",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "input": {
          "name": "input",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expected_output": {
          "name": "expected_output",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "source_trace_id": {
          "name": "source_trace_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "source_observation_id": {
          "name": "source_observation_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "dataset_id": {
          "name": "dataset_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "DatasetItem_pkey": {
          "name": "DatasetItem_pkey",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "DatasetItem_source_trace_id_idx": {
          "name": "DatasetItem_source_trace_id_idx",
          "unique": false,
          "columns": [
            "source_trace_id"
          ],
          "type": "Hash"
        },
        "DatasetItem_source_observation_id_idx": {
          "name": "DatasetItem_source_observation_id_idx",
          "unique": false,
          "columns": [
            "source_observation_id"
          ],
          "type": "Hash"
        },
        "DatasetItem_dataset_id_idx": {
          "name": "DatasetItem_dataset_id_idx",
          "unique": false,
          "columns": [
            "dataset_id"
          ],
          "type": "Hash"
        },
        "DatasetItem_created_at_idx": {
          "name": "DatasetItem_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "DatasetItem_updated_at_idx": {
          "name": "DatasetItem_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        }
      },
      "constraints": {
        "DatasetToDatasetItem": {
          "type": "FOREIGN KEY",
          "name": "DatasetToDatasetItem",
          "columnName": "dataset_id",
          "targetTableName": "Dataset",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "DatasetRuns": {
      "name": "DatasetRuns",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "description": {
          "name": "description",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "metadata": {
          "name": "metadata",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "dataset_id": {
          "name": "dataset_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "DatasetRuns_pkey": {
          "name": "DatasetRuns_pkey",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "DatasetRuns_dataset_id_idx": {
          "name": "DatasetRuns_dataset_id_idx",
          "unique": false,
          "columns": [
            "dataset_id"
          ],
          "type": "Hash"
        },
        "DatasetRuns_created_at_idx": {
          "name": "DatasetRuns_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "DatasetRuns_updated_at_idx": {
          "name": "DatasetRuns_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        },
        "DatasetRuns_dataset_id_project_id_name_key": {
          "name": "DatasetRuns_dataset_id_project_id_name_key",
          "unique": true,
          "columns": [
            "dataset_id",
            "project_id",
            "name"
          ],
          "type": ""
        }
      },
      "constraints": {
        "DatasetToDatasetRuns": {
          "type": "FOREIGN KEY",
          "name": "DatasetToDatasetRuns",
          "columnName": "dataset_id",
          "targetTableName": "Dataset",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "DatasetRunItems": {
      "name": "DatasetRunItems",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "dataset_run_id": {
          "name": "dataset_run_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "dataset_item_id": {
          "name": "dataset_item_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "trace_id": {
          "name": "trace_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "observation_id": {
          "name": "observation_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "DatasetRunItems_pkey": {
          "name": "DatasetRunItems_pkey",
          "unique": true,
          "columns": [
            "id",
            "project_id"
          ],
          "type": ""
        },
        "DatasetRunItems_dataset_run_id_idx": {
          "name": "DatasetRunItems_dataset_run_id_idx",
          "unique": false,
          "columns": [
            "dataset_run_id"
          ],
          "type": "Hash"
        },
        "DatasetRunItems_dataset_item_id_idx": {
          "name": "DatasetRunItems_dataset_item_id_idx",
          "unique": false,
          "columns": [
            "dataset_item_id"
          ],
          "type": "Hash"
        },
        "DatasetRunItems_observation_id_idx": {
          "name": "DatasetRunItems_observation_id_idx",
          "unique": false,
          "columns": [
            "observation_id"
          ],
          "type": "Hash"
        },
        "DatasetRunItems_trace_id_idx": {
          "name": "DatasetRunItems_trace_id_idx",
          "unique": false,
          "columns": [
            "trace_id"
          ],
          "type": ""
        },
        "DatasetRunItems_created_at_idx": {
          "name": "DatasetRunItems_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "DatasetRunItems_updated_at_idx": {
          "name": "DatasetRunItems_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        }
      },
      "constraints": {
        "DatasetRunItemsToDatasetRuns": {
          "type": "FOREIGN KEY",
          "name": "DatasetRunItemsToDatasetRuns",
          "columnName": "dataset_run_id",
          "targetTableName": "DatasetRuns",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "DatasetItemToDatasetRunItems": {
          "type": "FOREIGN KEY",
          "name": "DatasetItemToDatasetRunItems",
          "columnName": "dataset_item_id",
          "targetTableName": "DatasetItem",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "Comment": {
      "name": "Comment",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "object_type": {
          "name": "object_type",
          "type": "CommentObjectType",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "object_id": {
          "name": "object_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "content": {
          "name": "content",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "author_user_id": {
          "name": "author_user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Comment_pkey": {
          "name": "Comment_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Comment_project_id_object_type_object_id_idx": {
          "name": "Comment_project_id_object_type_object_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "object_type",
            "object_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "CommentToProject": {
          "type": "FOREIGN KEY",
          "name": "CommentToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "Prompt": {
      "name": "Prompt",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_by": {
          "name": "created_by",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "prompt": {
          "name": "prompt",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "version": {
          "name": "version",
          "type": "integer",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "type": {
          "name": "type",
          "type": "text",
          "default": "text",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "is_active": {
          "name": "is_active",
          "type": "boolean",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "config": {
          "name": "config",
          "type": "json",
          "default": "{}",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "tags": {
          "name": "tags",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "labels": {
          "name": "labels",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "commit_message": {
          "name": "commit_message",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Prompt_pkey": {
          "name": "Prompt_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Prompt_project_id_id_idx": {
          "name": "Prompt_project_id_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "id"
          ],
          "type": ""
        },
        "Prompt_created_at_idx": {
          "name": "Prompt_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "Prompt_updated_at_idx": {
          "name": "Prompt_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        },
        "Prompt_tags_idx": {
          "name": "Prompt_tags_idx",
          "unique": false,
          "columns": [
            "tags"
          ],
          "type": "Gin"
        },
        "Prompt_project_id_name_version_key": {
          "name": "Prompt_project_id_name_version_key",
          "unique": true,
          "columns": [
            "project_id",
            "name",
            "version"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ProjectToPrompt": {
          "type": "FOREIGN KEY",
          "name": "ProjectToPrompt",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "PromptDependency": {
      "name": "PromptDependency",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "parent_id": {
          "name": "parent_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "child_name": {
          "name": "child_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "child_label": {
          "name": "child_label",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "child_version": {
          "name": "child_version",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "PromptDependency_pkey": {
          "name": "PromptDependency_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "PromptDependency_project_id_parent_id_idx": {
          "name": "PromptDependency_project_id_parent_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "parent_id"
          ],
          "type": ""
        },
        "PromptDependency_project_id_child_name_idx": {
          "name": "PromptDependency_project_id_child_name_idx",
          "unique": false,
          "columns": [
            "project_id",
            "child_name"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ProjectToPromptDependency": {
          "type": "FOREIGN KEY",
          "name": "ProjectToPromptDependency",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "PromptToPromptDependency": {
          "type": "FOREIGN KEY",
          "name": "PromptToPromptDependency",
          "columnName": "parent_id",
          "targetTableName": "Prompt",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "Model": {
      "name": "Model",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "model_name": {
          "name": "model_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "match_pattern": {
          "name": "match_pattern",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "start_date": {
          "name": "start_date",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "input_price": {
          "name": "input_price",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "output_price": {
          "name": "output_price",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "total_price": {
          "name": "total_price",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "unit": {
          "name": "unit",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "tokenizer_id": {
          "name": "tokenizer_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "tokenizer_config": {
          "name": "tokenizer_config",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Model_pkey": {
          "name": "Model_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Model_model_name_idx": {
          "name": "Model_model_name_idx",
          "unique": false,
          "columns": [
            "model_name"
          ],
          "type": ""
        },
        "Model_project_id_model_name_start_date_unit_key": {
          "name": "Model_project_id_model_name_start_date_unit_key",
          "unique": true,
          "columns": [
            "project_id",
            "model_name",
            "start_date",
            "unit"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ModelToProject": {
          "type": "FOREIGN KEY",
          "name": "ModelToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "Price": {
      "name": "Price",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "model_id": {
          "name": "model_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "usage_type": {
          "name": "usage_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "price": {
          "name": "price",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Price_pkey": {
          "name": "Price_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Price_model_id_usage_type_key": {
          "name": "Price_model_id_usage_type_key",
          "unique": true,
          "columns": [
            "model_id",
            "usage_type"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ModelToPrice": {
          "type": "FOREIGN KEY",
          "name": "ModelToPrice",
          "columnName": "model_id",
          "targetTableName": "Model",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "AuditLog": {
      "name": "AuditLog",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "type": {
          "name": "type",
          "type": "AuditLogRecordType",
          "default": "USER",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "api_key_id": {
          "name": "api_key_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "org_id": {
          "name": "org_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_org_role": {
          "name": "user_org_role",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_project_role": {
          "name": "user_project_role",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "resource_type": {
          "name": "resource_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "resource_id": {
          "name": "resource_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "action": {
          "name": "action",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "before": {
          "name": "before",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "after": {
          "name": "after",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "AuditLog_pkey": {
          "name": "AuditLog_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "AuditLog_project_id_idx": {
          "name": "AuditLog_project_id_idx",
          "unique": false,
          "columns": [
            "project_id"
          ],
          "type": ""
        },
        "AuditLog_api_key_id_idx": {
          "name": "AuditLog_api_key_id_idx",
          "unique": false,
          "columns": [
            "api_key_id"
          ],
          "type": ""
        },
        "AuditLog_user_id_idx": {
          "name": "AuditLog_user_id_idx",
          "unique": false,
          "columns": [
            "user_id"
          ],
          "type": ""
        },
        "AuditLog_org_id_idx": {
          "name": "AuditLog_org_id_idx",
          "unique": false,
          "columns": [
            "org_id"
          ],
          "type": ""
        },
        "AuditLog_created_at_idx": {
          "name": "AuditLog_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "AuditLog_updated_at_idx": {
          "name": "AuditLog_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        }
      }
    },
    "EvalTemplate": {
      "name": "EvalTemplate",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "version": {
          "name": "version",
          "type": "integer",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "prompt": {
          "name": "prompt",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "model": {
          "name": "model",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "provider": {
          "name": "provider",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "model_params": {
          "name": "model_params",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "vars": {
          "name": "vars",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "output_schema": {
          "name": "output_schema",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "EvalTemplate_pkey": {
          "name": "EvalTemplate_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "EvalTemplate_project_id_id_idx": {
          "name": "EvalTemplate_project_id_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "id"
          ],
          "type": ""
        },
        "EvalTemplate_project_id_name_version_key": {
          "name": "EvalTemplate_project_id_name_version_key",
          "unique": true,
          "columns": [
            "project_id",
            "name",
            "version"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "EvalTemplateToProject": {
          "type": "FOREIGN KEY",
          "name": "EvalTemplateToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "JobConfiguration": {
      "name": "JobConfiguration",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_type": {
          "name": "job_type",
          "type": "JobType",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "status": {
          "name": "status",
          "type": "JobConfigState",
          "default": "ACTIVE",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "eval_template_id": {
          "name": "eval_template_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "score_name": {
          "name": "score_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "filter": {
          "name": "filter",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "target_object": {
          "name": "target_object",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "variable_mapping": {
          "name": "variable_mapping",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "sampling": {
          "name": "sampling",
          "type": "decimal(65,30)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "delay": {
          "name": "delay",
          "type": "integer",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "time_scope": {
          "name": "time_scope",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "JobConfiguration_pkey": {
          "name": "JobConfiguration_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "JobConfiguration_project_id_id_idx": {
          "name": "JobConfiguration_project_id_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "JobConfigurationToProject": {
          "type": "FOREIGN KEY",
          "name": "JobConfigurationToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "EvalTemplateToJobConfiguration": {
          "type": "FOREIGN KEY",
          "name": "EvalTemplateToJobConfiguration",
          "columnName": "eval_template_id",
          "targetTableName": "EvalTemplate",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "SET_NULL"
        }
      }
    },
    "JobExecution": {
      "name": "JobExecution",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_configuration_id": {
          "name": "job_configuration_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "status": {
          "name": "status",
          "type": "JobExecutionStatus",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "start_time": {
          "name": "start_time",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "end_time": {
          "name": "end_time",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "error": {
          "name": "error",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_input_trace_id": {
          "name": "job_input_trace_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_input_observation_id": {
          "name": "job_input_observation_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_input_dataset_item_id": {
          "name": "job_input_dataset_item_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "job_output_score_id": {
          "name": "job_output_score_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "JobExecution_pkey": {
          "name": "JobExecution_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "JobExecution_project_id_status_idx": {
          "name": "JobExecution_project_id_status_idx",
          "unique": false,
          "columns": [
            "project_id",
            "status"
          ],
          "type": ""
        },
        "JobExecution_project_id_id_idx": {
          "name": "JobExecution_project_id_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "id"
          ],
          "type": ""
        },
        "JobExecution_job_configuration_id_idx": {
          "name": "JobExecution_job_configuration_id_idx",
          "unique": false,
          "columns": [
            "job_configuration_id"
          ],
          "type": ""
        },
        "JobExecution_job_output_score_id_idx": {
          "name": "JobExecution_job_output_score_id_idx",
          "unique": false,
          "columns": [
            "job_output_score_id"
          ],
          "type": ""
        },
        "JobExecution_job_input_trace_id_idx": {
          "name": "JobExecution_job_input_trace_id_idx",
          "unique": false,
          "columns": [
            "job_input_trace_id"
          ],
          "type": ""
        },
        "JobExecution_created_at_idx": {
          "name": "JobExecution_created_at_idx",
          "unique": false,
          "columns": [
            "created_at"
          ],
          "type": ""
        },
        "JobExecution_updated_at_idx": {
          "name": "JobExecution_updated_at_idx",
          "unique": false,
          "columns": [
            "updated_at"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "JobExecutionToProject": {
          "type": "FOREIGN KEY",
          "name": "JobExecutionToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "JobConfigurationToJobExecution": {
          "type": "FOREIGN KEY",
          "name": "JobConfigurationToJobExecution",
          "columnName": "job_configuration_id",
          "targetTableName": "JobConfiguration",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "SsoConfig": {
      "name": "SsoConfig",
      "columns": {
        "domain": {
          "name": "domain",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "auth_provider": {
          "name": "auth_provider",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "auth_config": {
          "name": "auth_config",
          "type": "jsonb",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "SsoConfig_pkey": {
          "name": "SsoConfig_pkey",
          "unique": true,
          "columns": [
            "domain"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_domain": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_domain",
          "columnName": "domain"
        }
      }
    },
    "PosthogIntegration": {
      "name": "PosthogIntegration",
      "columns": {
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "encrypted_posthog_api_key": {
          "name": "encrypted_posthog_api_key",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "posthog_host_name": {
          "name": "posthog_host_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "last_sync_at": {
          "name": "last_sync_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "PosthogIntegration_pkey": {
          "name": "PosthogIntegration_pkey",
          "unique": true,
          "columns": [
            "project_id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_project_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_project_id",
          "columnName": "project_id"
        },
        "PosthogIntegrationToProject": {
          "type": "FOREIGN KEY",
          "name": "PosthogIntegrationToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "BatchExport": {
      "name": "BatchExport",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "finished_at": {
          "name": "finished_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "name": {
          "name": "name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "status": {
          "name": "status",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "query": {
          "name": "query",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "format": {
          "name": "format",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "url": {
          "name": "url",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "log": {
          "name": "log",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "BatchExport_pkey": {
          "name": "BatchExport_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "BatchExport_project_id_user_id_idx": {
          "name": "BatchExport_project_id_user_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "user_id"
          ],
          "type": ""
        },
        "BatchExport_status_idx": {
          "name": "BatchExport_status_idx",
          "unique": false,
          "columns": [
            "status"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "BatchExportToProject": {
          "type": "FOREIGN KEY",
          "name": "BatchExportToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "Media": {
      "name": "Media",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "sha_256_hash": {
          "name": "sha_256_hash",
          "type": "char(44)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "uploaded_at": {
          "name": "uploaded_at",
          "type": "timestamp(3)",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "upload_http_status": {
          "name": "upload_http_status",
          "type": "integer",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "upload_http_error": {
          "name": "upload_http_error",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "bucket_path": {
          "name": "bucket_path",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "bucket_name": {
          "name": "bucket_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "content_type": {
          "name": "content_type",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "content_length": {
          "name": "content_length",
          "type": "bigint",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "Media_pkey": {
          "name": "Media_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "Media_project_id_sha_256_hash_key": {
          "name": "Media_project_id_sha_256_hash_key",
          "unique": true,
          "columns": [
            "project_id",
            "sha_256_hash"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "MediaToProject": {
          "type": "FOREIGN KEY",
          "name": "MediaToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "TraceMedia": {
      "name": "TraceMedia",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "media_id": {
          "name": "media_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "trace_id": {
          "name": "trace_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "field": {
          "name": "field",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "TraceMedia_pkey": {
          "name": "TraceMedia_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "TraceMedia_project_id_trace_id_media_id_field_key": {
          "name": "TraceMedia_project_id_trace_id_media_id_field_key",
          "unique": true,
          "columns": [
            "project_id",
            "trace_id",
            "media_id",
            "field"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ProjectToTraceMedia": {
          "type": "FOREIGN KEY",
          "name": "ProjectToTraceMedia",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "MediaToTraceMedia": {
          "type": "FOREIGN KEY",
          "name": "MediaToTraceMedia",
          "columnName": "media_id",
          "targetTableName": "Media",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "ObservationMedia": {
      "name": "ObservationMedia",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "media_id": {
          "name": "media_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "trace_id": {
          "name": "trace_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "observation_id": {
          "name": "observation_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "field": {
          "name": "field",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "ObservationMedia_pkey": {
          "name": "ObservationMedia_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        },
        "ObservationMedia_project_id_observation_id_idx": {
          "name": "ObservationMedia_project_id_observation_id_idx",
          "unique": false,
          "columns": [
            "project_id",
            "observation_id"
          ],
          "type": ""
        },
        "ObservationMedia_project_id_trace_id_observation_id_media_id_field_key": {
          "name": "ObservationMedia_project_id_trace_id_observation_id_media_id_field_key",
          "unique": true,
          "columns": [
            "project_id",
            "trace_id",
            "observation_id",
            "media_id",
            "field"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        },
        "ObservationMediaToProject": {
          "type": "FOREIGN KEY",
          "name": "ObservationMediaToProject",
          "columnName": "project_id",
          "targetTableName": "Project",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        },
        "MediaToObservationMedia": {
          "type": "FOREIGN KEY",
          "name": "MediaToObservationMedia",
          "columnName": "media_id",
          "targetTableName": "Media",
          "targetColumnName": "id",
          "updateConstraint": "NO_ACTION",
          "deleteConstraint": "CASCADE"
        }
      }
    },
    "QueueBackUp": {
      "name": "QueueBackUp",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "default": "cuid(1)",
          "notNull": true,
          "unique": true,
          "primary": true,
          "comment": null,
          "check": null
        },
        "project_id": {
          "name": "project_id",
          "type": "text",
          "default": null,
          "notNull": false,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "queue_name": {
          "name": "queue_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "content": {
          "name": "content",
          "type": "jsonb",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "QueueBackUp_pkey": {
          "name": "QueueBackUp_pkey",
          "unique": true,
          "columns": [
            "id"
          ],
          "type": ""
        }
      },
      "constraints": {
        "PRIMARY_id": {
          "type": "PRIMARY KEY",
          "name": "PRIMARY_id",
          "columnName": "id"
        }
      }
    },
    "BillingMeterBackup": {
      "name": "BillingMeterBackup",
      "columns": {
        "stripe_customer_id": {
          "name": "stripe_customer_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "meter_id": {
          "name": "meter_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "start_time": {
          "name": "start_time",
          "type": "timestamp(3)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "end_time": {
          "name": "end_time",
          "type": "timestamp(3)",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "aggregated_value": {
          "name": "aggregated_value",
          "type": "integer",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "event_name": {
          "name": "event_name",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "org_id": {
          "name": "org_id",
          "type": "text",
          "default": null,
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp(3)",
          "default": "now()",
          "notNull": true,
          "unique": false,
          "primary": false,
          "comment": null,
          "check": null
        }
      },
      "comment": null,
      "indexes": {
        "BillingMeterBackup_stripe_customer_id_meter_id_start_time_end_time_idx": {
          "name": "BillingMeterBackup_stripe_customer_id_meter_id_start_time_end_time_idx",
          "unique": false,
          "columns": [
            "stripe_customer_id",
            "meter_id",
            "start_time",
            "end_time"
          ],
          "type": ""
        },
        "BillingMeterBackup_stripe_customer_id_meter_id_start_time_end_time_key": {
          "name": "BillingMeterBackup_stripe_customer_id_meter_id_start_time_end_time_key",
          "unique": true,
          "columns": [
            "stripe_customer_id",
            "meter_id",
            "start_time",
            "end_time"
          ],
          "type": ""
        }
      },
      "constraints": {}
    }
  },
  "relationships": {
    "AccountToUser": {
      "name": "AccountToUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "Account",
      "foreignColumnName": "user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "NO_ACTION"
    },
    "SessionToUser": {
      "name": "SessionToUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "Session",
      "foreignColumnName": "user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "NO_ACTION"
    },
    "OrganizationMembershipToUser": {
      "name": "OrganizationMembershipToUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "OrganizationMembership",
      "foreignColumnName": "user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ProjectMembershipToUser": {
      "name": "ProjectMembershipToUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "ProjectMembership",
      "foreignColumnName": "user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "MembershipInvitationToUser": {
      "name": "MembershipInvitationToUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "MembershipInvitation",
      "foreignColumnName": "invited_by_user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "SET_NULL"
    },
    "LockedByUser": {
      "name": "LockedByUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "AnnotationQueueItem",
      "foreignColumnName": "locked_by_user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "SET_NULL"
    },
    "AnnotatorUser": {
      "name": "AnnotatorUser",
      "primaryTableName": "User",
      "primaryColumnName": "id",
      "foreignTableName": "AnnotationQueueItem",
      "foreignColumnName": "annotator_user_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "SET_NULL"
    },
    "OrganizationToOrganizationMembership": {
      "name": "OrganizationToOrganizationMembership",
      "primaryTableName": "Organization",
      "primaryColumnName": "id",
      "foreignTableName": "OrganizationMembership",
      "foreignColumnName": "org_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "OrganizationToProject": {
      "name": "OrganizationToProject",
      "primaryTableName": "Organization",
      "primaryColumnName": "id",
      "foreignTableName": "Project",
      "foreignColumnName": "org_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "MembershipInvitationToOrganization": {
      "name": "MembershipInvitationToOrganization",
      "primaryTableName": "Organization",
      "primaryColumnName": "id",
      "foreignTableName": "MembershipInvitation",
      "foreignColumnName": "org_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ProjectToProjectMembership": {
      "name": "ProjectToProjectMembership",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "ProjectMembership",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ApiKeyToProject": {
      "name": "ApiKeyToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "ApiKey",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "DatasetToProject": {
      "name": "DatasetToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "Dataset",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "MembershipInvitationToProject": {
      "name": "MembershipInvitationToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "MembershipInvitation",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "SET_NULL"
    },
    "ProjectToTraceSession": {
      "name": "ProjectToTraceSession",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "TraceSession",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ProjectToPrompt": {
      "name": "ProjectToPrompt",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "Prompt",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ModelToProject": {
      "name": "ModelToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "Model",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "EvalTemplateToProject": {
      "name": "EvalTemplateToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "EvalTemplate",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "JobConfigurationToProject": {
      "name": "JobConfigurationToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "JobConfiguration",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "JobExecutionToProject": {
      "name": "JobExecutionToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "JobExecution",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "LlmApiKeysToProject": {
      "name": "LlmApiKeysToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "LlmApiKeys",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "PosthogIntegrationToProject": {
      "name": "PosthogIntegrationToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "PosthogIntegration",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ProjectToScoreConfig": {
      "name": "ProjectToScoreConfig",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "ScoreConfig",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "BatchExportToProject": {
      "name": "BatchExportToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "BatchExport",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "CommentToProject": {
      "name": "CommentToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "Comment",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "AnnotationQueueToProject": {
      "name": "AnnotationQueueToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "AnnotationQueue",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "AnnotationQueueItemToProject": {
      "name": "AnnotationQueueItemToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "AnnotationQueueItem",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ProjectToTraceMedia": {
      "name": "ProjectToTraceMedia",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "TraceMedia",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "MediaToProject": {
      "name": "MediaToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "Media",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ObservationMediaToProject": {
      "name": "ObservationMediaToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "ObservationMedia",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "LegacyPrismaTraceToProject": {
      "name": "LegacyPrismaTraceToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "LegacyPrismaTrace",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "LegacyPrismaObservationToProject": {
      "name": "LegacyPrismaObservationToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "LegacyPrismaObservation",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "LegacyPrismaScoreToProject": {
      "name": "LegacyPrismaScoreToProject",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "LegacyPrismaScore",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ProjectToPromptDependency": {
      "name": "ProjectToPromptDependency",
      "primaryTableName": "Project",
      "primaryColumnName": "id",
      "foreignTableName": "PromptDependency",
      "foreignColumnName": "project_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "OrganizationMembershipToProjectMembership": {
      "name": "OrganizationMembershipToProjectMembership",
      "primaryTableName": "OrganizationMembership",
      "primaryColumnName": "id",
      "foreignTableName": "ProjectMembership",
      "foreignColumnName": "org_membership_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "LegacyPrismaScoreToScoreConfig": {
      "name": "LegacyPrismaScoreToScoreConfig",
      "primaryTableName": "ScoreConfig",
      "primaryColumnName": "id",
      "foreignTableName": "LegacyPrismaScore",
      "foreignColumnName": "config_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "NO_ACTION"
    },
    "AnnotationQueueToAnnotationQueueItem": {
      "name": "AnnotationQueueToAnnotationQueueItem",
      "primaryTableName": "AnnotationQueue",
      "primaryColumnName": "id",
      "foreignTableName": "AnnotationQueueItem",
      "foreignColumnName": "queue_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "DatasetToDatasetItem": {
      "name": "DatasetToDatasetItem",
      "primaryTableName": "Dataset",
      "primaryColumnName": "id",
      "foreignTableName": "DatasetItem",
      "foreignColumnName": "dataset_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "DatasetToDatasetRuns": {
      "name": "DatasetToDatasetRuns",
      "primaryTableName": "Dataset",
      "primaryColumnName": "id",
      "foreignTableName": "DatasetRuns",
      "foreignColumnName": "dataset_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "DatasetItemToDatasetRunItems": {
      "name": "DatasetItemToDatasetRunItems",
      "primaryTableName": "DatasetItem",
      "primaryColumnName": "id",
      "foreignTableName": "DatasetRunItems",
      "foreignColumnName": "dataset_item_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "DatasetRunItemsToDatasetRuns": {
      "name": "DatasetRunItemsToDatasetRuns",
      "primaryTableName": "DatasetRuns",
      "primaryColumnName": "id",
      "foreignTableName": "DatasetRunItems",
      "foreignColumnName": "dataset_run_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "PromptToPromptDependency": {
      "name": "PromptToPromptDependency",
      "primaryTableName": "Prompt",
      "primaryColumnName": "id",
      "foreignTableName": "PromptDependency",
      "foreignColumnName": "parent_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "ModelToPrice": {
      "name": "ModelToPrice",
      "primaryTableName": "Model",
      "primaryColumnName": "id",
      "foreignTableName": "Price",
      "foreignColumnName": "model_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "EvalTemplateToJobConfiguration": {
      "name": "EvalTemplateToJobConfiguration",
      "primaryTableName": "EvalTemplate",
      "primaryColumnName": "id",
      "foreignTableName": "JobConfiguration",
      "foreignColumnName": "eval_template_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "SET_NULL"
    },
    "JobConfigurationToJobExecution": {
      "name": "JobConfigurationToJobExecution",
      "primaryTableName": "JobConfiguration",
      "primaryColumnName": "id",
      "foreignTableName": "JobExecution",
      "foreignColumnName": "job_configuration_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "MediaToTraceMedia": {
      "name": "MediaToTraceMedia",
      "primaryTableName": "Media",
      "primaryColumnName": "id",
      "foreignTableName": "TraceMedia",
      "foreignColumnName": "media_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    },
    "MediaToObservationMedia": {
      "name": "MediaToObservationMedia",
      "primaryTableName": "Media",
      "primaryColumnName": "id",
      "foreignTableName": "ObservationMedia",
      "foreignColumnName": "media_id",
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "NO_ACTION",
      "deleteConstraint": "CASCADE"
    }
  },
  "tableGroups": {}
}
`

const toolName1 = 'get_howto_build_liam_schema_override_yml'
const toolName2 = 'get_schema_json'

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: toolName1,
        description: 'Get howto build your .liam/schema-override.yml',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: toolName2,
        description:
          'Retrieve your current schema.json, which represents the existing schema of your database. This provides a helpful reference when writing .liam/schema-override.yml.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === toolName1) {
    return {
      content: [
        {
          type: 'text',
          text: specificationText,
        },
      ],
    }
  }
  if (request.params.name === toolName2) {
    return {
      content: [
        {
          type: 'text',
          text: schemaJson,
        },
      ],
    }
  }
  throw new Error('Unknown prompt')
})

mcpCommand.action(async () => {
  const transport = new StdioServerTransport()
  await server.connect(transport)
})

export { mcpCommand }
