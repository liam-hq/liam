---
"@liam-hq/db-structure": minor
---

✨ Add support for Rails inline index syntax in schema.rb parser

- Support inline index declarations on columns: `t.string "name", index: true`
- Handle unique inline indexes: `t.text "mention", index: { unique: true }`
- Parse custom index names: `t.string "slug", index: { name: "custom_name" }`
- Support index types: `t.string "email", index: { using: "gin" }`