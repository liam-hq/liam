# pgTAP Extension

Unit testing framework for PostgreSQL, providing TAP (Test Anything Protocol) compliant assertions for database schema validation and testing.

## Usage

```typescript
import { PGlite } from '@electric-sql/pglite'
import { pgtap } from '@electric-sql/pglite/contrib/pgtap'

const db = new PGlite({ extensions: { pgtap } })
await db.query('CREATE EXTENSION pgtap')

// Basic TAP testing workflow
await db.query('BEGIN')
await db.query('SELECT plan(2)')
await db.query("SELECT ok(1 = 1, 'basic assertion')")
await db.query("SELECT has_table('users')")
await db.query('SELECT * FROM finish()')
await db.query('ROLLBACK')
```

## Bundle Creation

This extension demonstrates how to create custom PGlite extension bundles from PGXN packages:

### 1. Download Source

```bash
curl -L https://api.pgxn.org/dist/pgtap/1.3.3/pgtap-1.3.3.zip -o pgtap.zip
unzip pgtap.zip
cd pgtap-1.3.3
```

### 2. Process Template

```bash
# Substitute template variables (important: use "1.3" not "1.3.3")
sed 's/__VERSION__/1.3/g; s/__OS__/Linux/g' sql/pgtap.sql.in > pgtap--1.3.3.sql
```

### 3. Create PGlite-Compatible Control File

```bash
cat > pgtap.control << 'EOF'
comment = 'Unit testing for PostgreSQL'
default_version = '1.3.3'
relocatable = true
trusted = true
EOF
```

### 4. Build Extension Bundle

```bash
# Create required directory structure
mkdir -p share/postgresql/extension

# Copy files
cp pgtap.control share/postgresql/extension/
cp pgtap--1.3.3.sql share/postgresql/extension/

# Create bundle (no directory entries for PGlite compatibility)
tar -czf pgtap.tar.gz share/postgresql/extension/pgtap.control share/postgresql/extension/pgtap--1.3.3.sql
```

### Key Requirements

- **No C dependencies**: Only pure SQL/PL/pgSQL extensions work in WebAssembly
- **Bundle format**: Use file-only tar.gz (no directory entries)
- **Control file**: Must include `trusted = true` for PGlite
- **Template processing**: Handle `__VERSION__` and `__OS__` placeholders correctly

## Bundle size: ~38KB

## Key Features

- **Schema validation**: Test table/column existence, constraints, indexes
- **TAP protocol**: Standard test output format with ok/not ok assertions  
- **Transaction safe**: Tests can be wrapped in transactions and rolled back
- **Comprehensive**: 100+ testing functions for all PostgreSQL objects
- **WebAssembly ready**: Pure SQL implementation works in browser environment

## Testing Functions

```sql
-- Basic assertions
SELECT ok(expression, description);
SELECT is(actual, expected, description);

-- Schema testing
SELECT has_table('tablename');
SELECT has_column('table', 'column');
SELECT has_pk('table');
SELECT has_fk('table');

-- Data validation
SELECT bag_eq('SELECT * FROM actual', 'SELECT * FROM expected');
SELECT results_eq('query1', 'query2');
```

## References

- [pgTAP Documentation](https://pgtap.org/)
- [TAP Protocol](https://testanything.org/)
- [PGlite Extensions](https://pglite.dev/extensions/)