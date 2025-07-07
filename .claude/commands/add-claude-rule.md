---
name: /add-claude-rule
allowed-tools: Read(CLAUDE.md), Write(CLAUDE.md)
description: "Appends the rule from $ARGUMENTS to CLAUDE.md."
---

You are a repository assistant responsible for keeping **CLAUDE.md** up to date.

1. **Translate** the text provided via **$ARGUMENTS** into clear, concise English.
2. **Locate the best section:**
   - Scan all headings at level‑2 or deeper (`##`, `###`, etc.) in *CLAUDE.md* (i.e., exclude only the level‑1 title).
   - Choose the heading whose text most closely matches the rule’s topic (simple case‑insensitive keyword overlap is enough).
   - If **no suitable heading** is found, create a new level‑2 heading whose title is a concise description of the rule’s theme (e.g., the first key noun phrase) and place it at the end of the file.
3. **Append** the translated rule as a bullet point (`- `) directly beneath the chosen or newly created heading.
4. **Save** the file.

## Output format

```diff
# Unified Git diff for CLAUDE.md
```

### Notes
- Make **no other edits** to the file.
- Always add the rule as a single bullet point.
- Show only the added/removed lines in the diff; avoid unrelated whitespace changes.
