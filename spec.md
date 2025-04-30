
# Schema‑Override Specification (Draft)

> **Status:** Draft — v0.1 (2025‑04‑30)
>
> This document describes the *schema‑override* layer used in the **Liam** project for augmenting database schema documentation without changing the physical schema.

---

## 1  Purpose

The *schema‑override* mechanism allows contributors to attach rich, contextual metadata to an existing database schema. It is intentionally **non‑destructive**: **no migration or runtime behaviour** is affected.

- Problems it solves
  - Visualise **planned but not‑yet‑implemented** tables / columns ("TODO slots")
  - Provide domain‑specific comments, translations, and logical grouping
  - Serve as a single communication hub for PM / Designer / QA and engineers
  - Enable governance metadata (PII flags, data classification) without touching SQL

## 2  Scope

| Out of the box                     | Out of scope                      |
| ---------------------------------- | --------------------------------- |
| Table / column comments            | ALTER TABLE, constraints, indexes |
| Logical table groups               | Performance tuning hints          |
| Ad‑hoc relations not present in FK | Data migration scripts            |
| Metadata flags (PII, GDPR, etc.)   | RLS / policy definitions          |

## 3  File Format — `schema-override.yml`

```yaml
version: "0.1"

# 3.1  Table groups (logical modules)
tableGroups:
  payments:
    title: "Payments & Refunds"
    description: "All financial transaction tables"
    tables: [invoice, refund]

# 3.2  Table‑level overrides
tables:
  invoice:
    displayName: "Invoice"
    comment: "Issued bill for a customer order"
    columns:
      external_id:
        displayName: "External ID"
        description: "Reference from the billing gateway"
      amount:
        classification: personal_data

# 3.3  Extra relations (not in physical FK)
relations:
  - source: invoice.external_id
    target: external_invoices.id
    description: "Soft link to external billing records"
```

## 4  Workflow Summary

1. Developer or AI tool edits **schema-override.yml** in a PR
2. CI
   - Validates YAML against JSON Schema (Ajv)
   - Checks orphan entries vs. physical **schema.json**
3. Merge → `safeApplySchemaOverride.ts` merges at runtime / build
4. ER Viewer reads merged output and renders enriched diagram

## 5  Non‑goals

- Not a replacement for migration files
- Not intended for performance guidance; separate ADRs should cover that
- Should never block application startup — if override fails validation, build must fail early

---

## Appendix A — JSON Schema Definition (`schema-override.schema.json`, draft)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema Override",
  "type": "object",
  "required": ["version"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+(\\.\\d+)?$"
    },
    "tableGroups": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["tables"],
        "additionalProperties": false,
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "tables": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 1
          }
        }
      }
    },
    "tables": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "displayName": { "type": "string" },
          "comment": { "type": "string" },
          "columns": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "displayName": { "type": "string" },
                "description": { "type": "string" },
                "classification": {
                  "type": "string",
                  "enum": ["personal_data", "sensitive", "public", "internal"]
                }
              }
            }
          }
        }
      }
    },
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["source", "target"],
        "additionalProperties": false,
        "properties": {
          "source": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_]+\\.[A-Za-z0-9_]+$"
          },
          "target": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_]+\\.[A-Za-z0-9_]+$"
          },
          "description": { "type": "string" }
        }
      }
    }
  }
}
```

> **Note:** This schema is intentionally permissive at v0.1. Future revisions may tighten constraints (e.g. max length, reference integrity against `schema.json`).

---

### Next Steps

- Fine‑tune property names / enums based on real data
- Add localisation support (`comment.i18n.ja`, `comment.i18n.en`)
- Stabilise versioning policy (semver for override file itself)


