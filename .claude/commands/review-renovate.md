---
description: Review and merge renovate PRs with automerge configuration updates
allowed-tools: Bash(gh pr list:*), Bash(gh pr checks:*), Bash(gh pr checkout:*), Bash(pnpm install), Bash(pnpm test), Bash(pnpm build), Bash(pnpm lint)
---

## Task
Review renovate PRs following this workflow:

```mermaid
flowchart TD
    Start([Start]) --> ListPR["gh pr list --author=app/renovate --state open"]
    
    ListPR --> SelectPR{Select PR}
    SelectPR --> ViewPR[gh pr view to check PR details]
    
    ViewPR --> CheckCI{CI passing?}
    CheckCI -->|No| Investigation[Investigate issues]
    CheckCI -->|Yes| VersionType{Version change type}
    
    Investigation --> Checkout[gh pr checkout to get locally]
    Checkout --> Install[pnpm install to update dependencies]
    Install --> RunTests[Run pnpm test/build/lint]
    RunTests --> FixIssue{Fixable?}
    FixIssue -->|Yes| ApplyFix[Apply fix]
    FixIssue -->|No| Comment[Report with gh pr comment]
    
    ApplyFix --> CommitPush[git commit & push]
    CommitPush --> WaitCI[Wait for CI re-run]
    WaitCI --> CheckCI
    
    VersionType -->|patch| LowRisk[Low risk]
    VersionType -->|minor| MediumRisk[Medium risk]
    VersionType -->|major| HighRisk[High risk]
    
    LowRisk --> CheckChangelog[Check CHANGELOG/release notes]
    MediumRisk --> CheckChangelog
    HighRisk --> DetailedReview[Detailed review required]
    
    DetailedReview --> CheckChangelog
    CheckChangelog --> CheckSecurity{Security fix?}
    
    CheckSecurity -->|Yes| Priority[High priority]
    CheckSecurity -->|No| CheckDeps{Check dependencies}
    Priority --> CheckDeps
    
    CheckDeps --> PeerDeps{Peer deps compatibility OK?}
    PeerDeps -->|Yes| CheckAutomerge{Automerge-enabled<br/>package?}
    PeerDeps -->|No| Investigation
    
    CheckAutomerge -->|Yes| UpdateConfig[Update renovate.json5]
    CheckAutomerge -->|No| AddApprovalComment[Add approval comment with gh pr comment]
    
    UpdateConfig --> CreatePR[Create automerge config PR]
    CreatePR --> AddApprovalComment
    
    AddApprovalComment --> ApprovePR[Approve PR with gh pr review --approve]
    ApprovePR --> AddToMergeQueue[Add to merge queue with gh pr merge]
    
    AddToMergeQueue --> NextPR{Other PRs exist?}
    
    Comment --> Reject[Reject/postpone PR]
    
    Reject --> NextPR
    NextPR -->|Yes| SelectPR
    NextPR -->|No| End([Complete])
```

### Review Criteria
- **Security updates**: Always HIGH priority
- **Patch updates**: LOW risk - quick review
- **Minor updates**: MEDIUM risk - check for new features
- **Major updates**: HIGH risk - detailed review required

### Arguments
$ARGUMENTS

