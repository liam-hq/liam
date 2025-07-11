# Update PR Description

---
description: Update a pull request description to match the project's PR template
---

## Task

Update the specified pull request's description to follow the project's PR template format defined in @.github/pull_request_template.md.

The template includes these sections:

- Issue (with "resolve:" field)
- Why is this change needed?
- What would you like reviewers to focus on?
- Testing Verification
- What was done (with pr_agent:summary placeholder)
- Detailed Changes (with pr_agent:walkthrough placeholder)
- Additional Notes

### Steps

1. Check the PR number provided in the arguments
2. Read the current PR description using `gh pr view`
3. Reformat the content to match the template structure
4. Keep pr_agent placeholders intact (pr_agent:summary and pr_agent:walkthrough)
5. Update the PR using `gh pr edit`

### Arguments

$ARGUMENTS
