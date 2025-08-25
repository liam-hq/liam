# Update PR Description

---
description: Update a pull request description to match the project's PR template
---

## Task

Update the specified pull request's description to follow the project's PR template format defined in @.github/pull_request_template.md.

**IMPORTANT**:
- Always read the exact content of @.github/pull_request_template.md first to understand the current template structure. Do not assume the template contains sections that are not actually present.
- **Write all PR descriptions in English**. This is critical for project consistency.

### Steps

1. **Read the template file**: Use the Read tool to get the exact content of @.github/pull_request_template.md
2. **Get current PR info**: Use `gh pr view --json number,title,body` to get the current PR details
3. **Analyze the changes**: Use `gh pr diff` to understand what changes were made in the PR
4. **Update the description**: Use the exact template structure from step 1 and fill in appropriate content based on the PR's purpose and changes
5. **Apply the update**: Use `gh pr edit` with the properly formatted description

### Common Mistakes to Avoid

1. **Assuming Template Content**: Always read the template file - don't assume what sections exist
2. **Adding Non-existent Sections**: Only use sections that are actually in the template
3. **Incomplete Descriptions**: Ensure all required sections are filled with meaningful content
4. **Incorrect Section Headers**: Use the exact section headers from the template

### Example Command Usage

```bash
# Update PR description for current PR
gh pr edit --body "$(cat <<'EOF'
[Use the exact template structure from @.github/pull_request_template.md]
EOF
)"
```

### Arguments

$ARGUMENTS
