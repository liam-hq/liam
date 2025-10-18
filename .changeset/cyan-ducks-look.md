---
"@liam-hq/erd-core": patch
---

- ✨ Add linkable anchors and hash-based focus for index items in TableDetail
  - Support `#<table>__indexes__<index_name>` anchors and hashchange handling
  - Show visual focus (blink indicator + outline) on the targeted index item
  - Adjust scroll positioning for CollapsibleHeader and item scroll-margin
  - Extend internal hash schema to accept `__indexes__` IDs
