# Feature Specification: Add SQL Syntax Validation to Test Case Saving

**Feature Branch**: `002-frontend-packages-pglite`  
**Created**: 2025-09-08  
**Status**: Draft  
**Input**: User description: "## 概要
現在、`frontend/packages/pglite-server/src/PGliteInstanceManager.ts` でSQL実行時に`pgParse`を使用して構文チェックを行っていますが、これはDML生成時に行うべきです。

## 現状の問題点

### 1. 実行時の構文チェック（PGliteInstanceManager.ts:34-50）
```typescript
private async executeSql(sqlText: string, db: PGlite): Promise<SqlResult[]> {
  try {
    const parseResult: PgParseResult = await pgParse(sqlText)
    
    if (parseResult.error) {
      return [this.createParseErrorResult(sqlText, parseResult.error.message)]
    }
    // ...
  }
}
```

実行時に構文エラーを発見しても、すでにDML生成が完了しているため修正が困難です。

### 2. テストケース保存時には構文チェックなし
- `frontend/internal-packages/agent/src/qa-agent/generateDml/` でDML生成を行う
- AIモデル（generateDmlNode）がSQL文を生成するが、構文の妥当性は検証されていない
- `saveTestcaseTool` でテストケースを保存する時点でも、含まれるDML操作のSQL構文チェックは行われない

## 提案する改善

### 1. テストケース保存時の構文検証
`saveTestcaseTool` でテストケースを保存する前に、含まれるDML操作のSQL文に対して`pgParse`を実行し、構文エラーがあれば：
- エラーメッセージを返す
- AIモデルに再生成を促す
- 正しい構文のSQLを含むテストケースのみを保存する

### 2. 実装箇所
- 既存の `frontend/internal-packages/agent/src/qa-agent/tools/saveTestcaseTool.ts` に構文チェックロジックを追加
- テストケース内の`dmlOperation.sql`に対して`pgParse`を実行
- エラーがあれば適切なエラーメッセージと共にテストケース保存を拒否

### 3. PGliteInstanceManagerの簡素化
構文チェックをDML生成時に移動することで：
- 実行時のエラーハンドリングを簡素化
- パフォーマンスの向上（無効なSQLを実行しない）
- より早い段階でのエラー検出

## 技術的詳細

### 影響を受けるファイル
1. `frontend/internal-packages/agent/src/qa-agent/tools/saveTestcaseTool.ts`
   - `pgParse`を追加インポート
   - テストケース保存前のDML操作SQL構文検証ロジックを実装

2. `frontend/packages/pglite-server/src/PGliteInstanceManager.ts`
   - 構文チェックロジックの削除またはオプション化を検討
   - フォールバック処理の見直し

### 依存関係
- `@liam-hq/schema/parser` パッケージの`pgParse`関数を両方で使用
- エラーメッセージの一貫性を保つ必要がある

## メリット
1. **早期エラー検出**: テストケース保存段階で構文エラーを発見・修正
2. **品質向上**: 無効なSQLを含むテストケースがデータベースに到達しない
3. **開発効率**: エラーの原因をより早く特定可能
4. **責務の明確化**: 構文チェックはテストケース保存時の責任として明確化

## 検討事項
- パフォーマンスへの影響（テストケース保存時に追加の構文チェック）
- エラーリトライのロジック
- 既存のテストへの影響

## 関連PR/Issue
- liam-hq/liam#3186 - refactor: simplify QA agent DML generation with tool-based approach"

## Execution Flow (main)
```
1. Parse user description from Input
   → Complete: Technical improvement to move SQL syntax validation earlier in the process
2. Extract key concepts from description
   → Identified: SQL validation, DML generation, error handling, performance optimization
3. For each unclear aspect:
   → Resolved: Error retry strategy - 3 attempts before giving up
   → Resolved: Performance threshold - no specific threshold required for initial implementation
4. Fill User Scenarios & Testing section
   → Complete: User interactions with SQL generation and execution
5. Generate Functional Requirements
   → Complete: All requirements are testable
6. Identify Key Entities (if data involved)
   → Complete: DML operations, SQL syntax validation results
7. Run Review Checklist
   → SUCCESS - all clarifications resolved
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a user working with the QA agent, I want to receive immediate feedback when saving test cases with DML operations so that I can quickly correct any SQL syntax errors before attempting execution, reducing development time and improving the overall user experience.

### Acceptance Scenarios
1. **Given** a user attempts to save a test case through the QA agent, **When** the test case contains DML operations with correct SQL syntax, **Then** the test case is saved successfully and ready for execution
2. **Given** a user attempts to save a test case through the QA agent, **When** the test case contains DML operations with SQL syntax errors, **Then** the system provides clear error messages and prevents saving the invalid test case
3. **Given** valid test cases with DML operations have been saved, **When** the user executes them, **Then** the execution process runs efficiently without redundant syntax checking
4. **Given** the system encounters syntax validation during test case saving, **When** the validation process runs, **Then** it completes within acceptable time limits without significantly impacting user experience

### Edge Cases
- What happens when syntax validation takes too long during test case saving?
- How does the system handle intermittent failures in the syntax parsing service?
- What occurs when the AI model repeatedly generates test cases with invalid SQL despite error feedback?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST validate SQL syntax during test case saving before storing test cases with DML operations
- **FR-002**: System MUST provide clear, actionable error messages when syntax validation fails
- **FR-003**: System MUST prevent test cases containing invalid SQL from being saved
- **FR-004**: System MUST allow AI model regeneration when syntax errors are detected in test cases
- **FR-005**: System MUST maintain backward compatibility for existing valid test cases with DML operations
- **FR-006**: System MUST complete syntax validation without specific performance requirements for initial implementation
- **FR-007**: System MUST implement retry logic with maximum of 3 attempts before giving up
- **FR-008**: System MUST simplify SQL execution flow by removing redundant syntax checking
- **FR-009**: System MUST preserve error message consistency across validation points
- **FR-010**: Users MUST receive immediate feedback when test case saving encounters SQL syntax errors

### Key Entities *(include if feature involves data)*
- **DML Operation**: Represents a data manipulation operation with SQL content, metadata, and validation status
- **Syntax Validation Result**: Contains validation status, error messages, and parsing information for SQL statements
- **Generation Context**: Tracks the AI model's generation attempts, errors encountered, and retry state

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
