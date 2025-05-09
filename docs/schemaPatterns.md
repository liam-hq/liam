# Table Definition Guidelines

## Table of Contents

1. **Assumptions**  
2. **Naming & Style Conventions**  
   2.1 Identifiers (tables, columns, FK names, indexes)  
   2.2 SQL formatting & comments  
3. **Row‑Level Security (RLS)**  
   3.1 Default policy matrix  
   3.2 Example policies  
4. **Referential Integrity**  
   4.1 Foreign‑key constraints  
   4.2 Structural‑modeling patterns  
5. **Data Types & Preferred Types**  
   5.1 Primary keys  
   5.2 Timestamp columns  
   5.3 ENUMs & limited vocabularies  
6. **Ensuring Data Consistency**  
   6.1 CHECK constraints  
   6.2 Triggers  
   6.3 RPCs  
7. **Testing Database Functions**  
   7.1 Purpose and benefits  
   7.2 CI workflow for database tests  
   7.3 Local testing environment  
   7.4 PGTap test implementation  
   7.5 Example test cases

---

## 1. Assumptions

- The **`anon key` is never exposed to the browser**.  
- Access to Supabase via PostgREST is limited to:  
  - **Server Components / Server Actions / API Routes** in the Next.js app (Node.js runtime)  
  - **trigger.dev** workers  
- Both clients can use the `anon key` and the `service_role key`.  
  - RLS applies **only** to the **`authenticated` role** (derived from the `anon key`).  
  - The **`service_role` role bypasses RLS**. Prefer `authenticated` whenever possible.

---

## 2. Naming & Style Conventions

### 2.1 Identifiers

| Scope      | Rule | Example |
|------------|------|---------|
| Tables     | **snake_case, plural** | `knowledge_suggestion_doc_mappings` |
| Columns    | **snake_case, singular** | `title`, `author_id` |
| FKs        | `<referenced_table>_id` | `user_id` → `users.id` |
| Other IDs  | Don't append `_id` to non‑FKs; rename clearly | `github_installation_identifier` |

- **Avoid prefixes** such as `tbl_`.  
- **Every table gets a primary key** named `id`, defined as `identity generated always` *or* `uuid default gen_random_uuid()`, depending on project policy.  
- **A table name must never be the same as any of its column names** (avoids ambiguous SQL).  
- All objects live in the **`public` schema** unless explicitly stated.

### 2.2 SQL Formatting & Comments

| Guideline | Rationale |
|-----------|-----------|
| Use **lower‑case** for SQL keywords (`select`, `insert` …) | Consistency & diff‑friendliness |
| Apply **consistent whitespace / indentation** | Readability |
| **Block comments** `/* ... */` for large sections; **line comments** `--` for single lines | Self‑documenting DDL |
| **Table comments** (≤ 1024 chars) describe purpose | Discoverability |
| **Qualify schema** (`public.table_name`) in queries | Eliminates search‑path ambiguity |

---

## 3. Row‑Level Security (RLS)

### 3.1 Default Policy Matrix _(for the `authenticated` role)_

| Operation | Default | Notes |
|-----------|---------|-------|
| `select`  | ✅ — only rows within the same organization | |
| `insert`  | ❌ | Enable where user‑generated content is needed |
| `update`  | ❌ | Prefer soft‑update patterns or service‑role tasks |
| `delete`  | ❌ | Usually restricted to system jobs or admins |

Add explicit allow‑lists per table as requirements evolve.

### 3.2 Example Policy – `projects`

```sql
create policy authenticated_users_can_insert_projects
  on public.projects
  for insert to authenticated
  with check (
    organization_id in (
      select organization_members.organization_id
      from public.organization_members
      where organization_members.user_id = auth.uid()
    )
  );

comment on policy authenticated_users_can_insert_projects
  on public.projects is
  'Authenticated users can create projects within their organization';
```

---

## 4. Referential Integrity

### 4.1 Foreign‑Key Constraints

| Setting | Default | When to change |
|---------|---------|----------------|
| `on update` | **cascade** | Rarely changed |
| `on delete` | **cascade** | Switch to `restrict` only when the parent must never be removed |

### 4.2 Structural‑Modeling Patterns

- Declare FKs explicitly to maintain referential integrity.  
- Document relationship directionality in comments.  
- *Optional*: for many‑to‑many relationships, consider **dedicated junction tables** (`foo_bar_mappings`) instead of storing an array of IDs. This improves indexing flexibility and enforces referential integrity. Use only if it matches your domain model.


---

## 5. Data Types & Preferred Types

### 5.1 Primary Keys

- `id identity generated always` **or** `uuid default gen_random_uuid()`; pick one pattern repo‑wide.

### 5.2 Timestamp Columns

- Always use **`timestamptz`** to store UTC with timezone.  
- Store human‑readable dates in **ISO 8601** when serialized (`yyyy‑mm‑ddTHH:MM:SS.ffffffZ`).  
- **Review ORM mappings and deployment pipelines** to ensure they generate or migrate columns as `timestamptz`, not plain `timestamp`.

### 5.3 ENUMs

- Use **PostgreSQL ENUM types** for small, closed vocabularies (e.g., status, severity).  
- Version‑lock ENUM changes in migrations.

---

## 6. Ensuring Data Consistency

### 6.1 CHECK Constraints

In most cases **business‑level validation happens in code** (Server Components, Server Actions, trigger.dev) using *Valibot* or similar.  
Add a DB‑level CHECK **only when**:
1. A rule absolutely **must be enforced at the storage layer** (e.g., a critical numeric range).  
2. The rule cannot be bypassed by legitimate update paths.  
Otherwise, skip the CHECK to keep migrations simpler.

### 6.2 Triggers

Typical use‑case: enforce cross‑table invariants that FKs alone cannot cover.

```sql
-- Example: doc_file_paths.organization_id must equal projects.organization_id
create or replace function ensure_doc_file_path_organization_matches_project()
returns trigger as $$
declare
  project_org_id uuid;
begin
  select organization_id
    into project_org_id
    from projects
   where id = new.project_id;

  if project_org_id is null then
    raise exception 'Project (id=%) does not exist', new.project_id;
  end if;

  if new.organization_id is distinct from project_org_id then
    raise exception
      'organization_id mismatch: doc_file_paths.organization_id (%) must match project.organization_id (%)',
      new.organization_id, project_org_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_doc_file_paths_ensure_org_match
before insert or update on doc_file_paths
for each row execute function ensure_doc_file_path_organization_matches_project();
```

Additional trigger patterns (e.g., `project_id` consistency) can be added as the schema evolves.

### 6.3 RPCs

Use Postgres RPCs (`create function ...`) when:

1. A single business operation spans **multiple tables** and must run atomically.  
2. Logic is too complex to express solely through permissions (e.g., conditional inserts, audit trails).

RPCs encapsulate business logic in the database layer while keeping application code lean.

---

## 7. Testing Database Functions

### 7.1 Purpose and Benefits

Testing database functions, particularly RPCs, provides several key benefits:

1. **Enhanced Quality Assurance**: Automatically verifies the behavior of database functions, enabling early detection and correction of bugs.
2. **Regression Testing**: Ensures that future changes do not break existing functionality.
3. **Improved Development Process**: Simplifies test execution in local environments, increasing developer productivity.
4. **Documentation Role**: Test code explicitly demonstrates the expected behavior of functions, aiding in code understanding.

### 7.2 CI Workflow for Database Tests

A dedicated GitHub Actions workflow (`.github/workflows/database-ci.yml`) can be configured to automatically run database tests under the following conditions:

- When PRs are created/updated and database-related files are changed
- When merge group events occur
- When manually triggered

The workflow typically:
1. Starts a Supabase environment
2. Performs test setup
3. Runs PGTap tests

### 7.3 Local Testing Environment

A local testing script (e.g., `frontend/packages/db/supabase/tests/run-tests.sh`) allows developers to easily run tests in their local environment. This script should:

- Check if Supabase is running and start it if necessary
- Set up the test environment
- Execute the tests

The test environment setup (`.github/workflows/setup-testing.sql`) should provide:
- Installation of the PGTap extension
- Creation of a test schema
- Functions for creating test users
- Functions for retrieving user IDs

### 7.4 PGTap Test Implementation

[PGTap](https://pgtap.org/) is a TAP-compliant testing framework for PostgreSQL that allows writing unit tests in SQL. Tests are organized in files with a `.test.sql` extension and follow a structured format:

```sql
-- Start transaction and plan the number of tests
BEGIN;
SELECT plan(5);  -- Number of assertions planned

-- Test case 1: Function should return expected value
SELECT is(
  my_function('test_input'),
  'expected_output',
  'my_function should return expected output for test_input'
);

-- Test case 2: Function should handle edge case
SELECT is(
  my_function(NULL),
  NULL,
  'my_function should return NULL when input is NULL'
);

-- Finish the test
SELECT * FROM finish();
ROLLBACK;
```

### 7.5 Example Test Cases

Below is an example of test cases for the `invite_organization_member` RPC function:

```sql
-- File: frontend/packages/db/supabase/tests/database/01-invite_organization_member.test.sql
BEGIN;
SELECT plan(5);

-- Setup: Create test organization and users
SELECT test_setup_organization('Test Org', 'test-org', org_id);
SELECT test_setup_user('owner@example.com', owner_id);
SELECT test_setup_user('member@example.com', member_id);

-- Test case 1: New user invitation
SELECT is(
  (SELECT invite_organization_member(org_id, 'new@example.com', owner_id)),
  'success',
  'Should successfully invite a new member'
);

-- Verify invitation record exists
SELECT ok(
  EXISTS(
    SELECT 1 FROM organization_invitations 
    WHERE email = 'new@example.com' AND organization_id = org_id
  ),
  'Invitation record should be created in the database'
);

-- Test case 2: Duplicate prevention
SELECT throws_ok(
  format('SELECT invite_organization_member(%L, %L, %L)', org_id, 'member@example.com', owner_id),
  'User is already a member of this organization',
  'Should prevent inviting existing members'
);

-- Test case 3: Re-invitation functionality
SELECT is(
  (SELECT invite_organization_member(org_id, 'pending@example.com', owner_id)),
  'success',
  'Should successfully re-invite a user with pending invitation'
);

-- Test case 4: Case insensitivity
SELECT is(
  (SELECT invite_organization_member(org_id, 'NEW@example.com', owner_id)),
  'success',
  'Should handle email addresses case-insensitively'
);

-- Test case 5: Timestamp update on re-invitation
SELECT ok(
  (
    SELECT invited_at > (NOW() - INTERVAL '1 minute')
    FROM organization_invitations
    WHERE email = 'pending@example.com' AND organization_id = org_id
  ),
  'Should update the invited_at timestamp on re-invitation'
);

-- Finish the test
SELECT * FROM finish();
ROLLBACK;
```

This test file covers:
1. **New User Invitation**: Verifies that a new member can be invited to an organization
2. **Duplicate Prevention**: Verifies that an error is returned when attempting to invite an existing member
3. **Re-invitation Functionality**: Verifies the behavior when re-inviting a user with a pending invitation
4. **Case Insensitivity**: Verifies that email addresses are processed correctly regardless of case
5. **Timestamp Update**: Verifies that the `invited_at` timestamp is appropriately updated during re-invitation

---

## Appendix A – Example Table

```sql
create table public.books (
  id         uuid primary key default gen_random_uuid(),
  title      text      not null,
  author_id  uuid      references public.authors (id)
);
comment on table public.books is
  'A list of all the books in the library.';
