# DB Structure Package Specification

## 1. Overview
### 1.1 Purpose
The @liam-hq/db-structure package is responsible for parsing various database schema formats and converting them into a unified, standardized data structure. This package serves as the foundation for all schema visualization and analysis features in the Liam project.

### 1.2 Scope
This package handles:
- Detection of database schema formats (PostgreSQL SQL, Prisma, Rails schema.rb, TBLS JSON)
- Parsing of 4 main schema definition languages
- Conversion to a standardized internal representation
- Error reporting for schema definitions
- Database schema diffing and patch operations
- Schema decompilation back to SQL
- Multi-database support via TBLS JSON format

### 1.3 Terminology
- **Schema**: Database structure definition in various formats
- **Parser**: Component that converts schema format to internal representation
- **AST**: Abstract Syntax Tree representation of parsed schema
- **DDL**: Data Definition Language (SQL commands for schema creation)
- **ORM**: Object-Relational Mapping frameworks (Prisma, Rails, etc.)

## 2. Functional Requirements
### 2.1 Core Features
- **Format Detection**: Automatically identify schema format from content or file extension
- **Multi-format Parsing**: Support PostgreSQL SQL, Prisma, Rails schema.rb, and TBLS JSON
- **Unified Output**: Convert all formats to a consistent internal representation
- **Error Handling**: Provide error messages with processing context
- **Relationship Detection**: Extract relationships from foreign key constraints
- **Constraint Parsing**: Extract all constraints (primary keys, foreign keys, unique, check)
- **Schema Diffing**: Compare schemas and generate diff operations
- **Schema Decompilation**: Convert internal schema back to PostgreSQL SQL

### 2.2 Use Cases
1. **Parse PostgreSQL DDL**: Convert CREATE TABLE statements to structured data
2. **Parse ORM Schemas**: Extract schema from Prisma and Rails schema.rb files
3. **Parse TBLS JSON**: Import schema from TBLS JSON exports (supports MySQL/PostgreSQL)
4. **Schema Diffing**: Compare two schemas and identify changes
5. **Schema Migration**: Generate patch operations for schema updates
6. **Multi-database Support**: Handle MySQL schemas via TBLS JSON format

### 2.3 Constraints
- Must parse schemas efficiently for typical database sizes
- Error messages should provide context for debugging
- Must preserve essential schema metadata during parsing
- Parser must be deterministic and produce consistent output
- Support schema diffing and patch operations
- TBLS JSON format serves as bridge for multi-database support

## 3. Technical Specifications
### 3.1 Architecture
```typescript
// Actual package structure
db-structure/
├── src/
│   ├── index.ts             // Main package exports
│   ├── parser.ts            // Parser re-exports
│   ├── parser/
│   │   ├── index.ts         // Main parsing entry point
│   │   ├── errors.ts        // Error definitions
│   │   ├── types.ts         // Parser type definitions
│   │   ├── supportedFormat/
│   │   │   ├── detectFormat.ts    // Format detection
│   │   │   └── schema.ts          // Supported format types
│   │   ├── sql/
│   │   │   └── postgresql/        // PostgreSQL SQL parser
│   │   ├── prisma/
│   │   │   └── parser.ts          // Prisma schema parser
│   │   ├── schemarb/
│   │   │   └── parser.ts          // Rails schema.rb parser
│   │   └── tbls/
│   │       └── parser.ts          // TBLS JSON parser
│   ├── schema/
│   │   ├── schema.ts        // Core schema types
│   │   ├── factories.ts     // Schema factory functions
│   │   └── mergeSchema.ts   // Schema merging utilities
│   ├── diff/                // Schema diffing functionality
│   ├── operation/           // Patch operations
│   ├── deparser/            // Schema to SQL conversion
│   └── utils/               // Utility functions
```

### 3.2 Data Model
```typescript
// Core schema structure (actual implementation)
interface Schema {
  tables: Tables; // Record<string, Table>
}

interface Table {
  name: string;
  columns: Columns; // Record<string, Column>
  constraints: Constraints; // Record<string, Constraint>
  indexes: Indexes; // Record<string, Index>
  comment: string | null;
}

interface Column {
  name: string;
  type: string;
  default: string | number | boolean | null;
  check: string | null;
  notNull: boolean;
  comment: string | null;
}

// Constraint types
type Constraint = 
  | PrimaryKeyConstraint 
  | ForeignKeyConstraint 
  | UniqueConstraint 
  | CheckConstraint;

interface ForeignKeyConstraint {
  type: 'FOREIGN KEY';
  name: string;
  columnName: string;
  targetTableName: string;
  targetColumnName: string;
  updateConstraint: ForeignKeyConstraintReferenceOption;
  deleteConstraint: ForeignKeyConstraintReferenceOption;
}

// Relationships are derived from constraints
interface Relationship {
  name: string;
  primaryTableName: string;
  primaryColumnName: string;
  foreignTableName: string;
  foreignColumnName: string;
  cardinality: 'ONE_TO_ONE' | 'ONE_TO_MANY';
  updateConstraint?: string;
  deleteConstraint?: string;
}

interface ProcessError {
  message: string;
  // Simplified error structure in actual implementation
}

// Schema diff types
type SchemaDiffItem = 
  | TableRelatedDiffItem 
  | ColumnRelatedDiffItem 
  | ConstraintRelatedDiffItem 
  | IndexRelatedDiffItem;

type ChangeStatus = 'added' | 'deleted' | 'modified';
```


### 3.3 API Specification

```typescript
// Main parsing API
function parse(
  str: string,
  format: SupportedFormat,
): Promise<ProcessResult>;

// Format detection API
function detectFormat(
  content: string, 
  filename?: string
): SupportedFormat | null;

// Supported formats (actual implementation)
type SupportedFormat = 'postgres' | 'prisma' | 'schemarb' | 'tbls';

// Process result type
type ProcessResult = {
  value: Schema;
  errors: ProcessError[];
};

// Schema diffing API
function buildSchemaDiff(
  before: Schema,
  after: Schema
): SchemaDiffItem[];

// Schema decompilation API
function postgresqlSchemaDeparser(schema: Schema): string;
function postgresqlOperationDeparser(operations: Operation[]): string;

// Constraint to relationship conversion
function constraintsToRelationships(
  schema: Schema
): { relationships: Relationship[]; errors: string[] };
```

## 4. Interfaces
### 4.1 External Interfaces
- **Input**: Raw schema text in supported formats (PostgreSQL SQL, Prisma, Rails schema.rb, TBLS JSON)
- **Output**: Standardized Schema object with ProcessError array
- **File Support**: Handles .sql, .prisma, .rb, schema.json files
- **Multi-database**: MySQL support via TBLS JSON export format

### 4.2 Internal Interfaces
- **Parser Processors**: Individual processors for each supported format
- **Schema Merger**: Combines multiple schema definitions
- **Diff Engine**: Compares schemas and generates difference operations
- **Deparser**: Converts internal schema back to SQL
- **Relationship Extractor**: Derives relationships from foreign key constraints

### 4.3 Dependencies
- **@prisma/internals**: Prisma schema parsing
- **@ruby/prism**: Ruby/Rails schema.rb parsing via WASM
- **pg-query-emscripten**: PostgreSQL SQL parsing
- **valibot & zod**: Runtime type validation
- **neverthrow**: Result type for error handling
- **fast-json-patch**: Schema patch operations
- **ts-pattern**: Pattern matching utilities

## 5. Non-functional Requirements
### 5.1 Performance
- Parse 1000-line schema in < 100ms
- Memory usage < 50MB for typical schemas
- Support streaming for very large files
- Incremental parsing for real-time validation

### 5.2 Security
- Prevent ReDoS attacks in regex parsing
- Sanitize error messages to avoid exposing sensitive data
- Validate input size to prevent memory exhaustion

### 5.3 Extensibility
- TBLS JSON format enables new database support
- Modular parser architecture for new ORM formats
- Schema diffing and patch operation system
- Deparser system for SQL generation
- Utility functions for relationship extraction

## 6. Implementation Details
### 6.1 Parser Design
- Recursive descent parsing for SQL formats
- Regex-based parsing for simpler formats
- Error recovery to continue parsing after errors
- Source mapping for accurate error locations

### 6.2 State Management
- Stateless parsing functions
- Immutable data structures
- Pure functions for transformations

### 6.3 Error Handling
- Collect all errors during parsing
- Provide context and suggestions for fixes
- Support warning-level issues
- Internationalization for error messages

## 7. Testing Strategy
### 7.1 Testing Priorities
#### 7.1.1 High Priority (Must Have)
**Critical Parser Functions:**
- Schema parsing accuracy for all supported formats (PostgreSQL, Prisma, Rails schema.rb, TBLS JSON)
- Schema to internal representation conversion
- Foreign key constraint parsing and relationship extraction
- Error handling for malformed schema input

**Core Package Operations:**
- Schema diffing functionality and patch generation
- PostgreSQL schema decompilation (schema to SQL)
- Schema merging operations
- Type validation with valibot/zod schemas

#### 7.1.2 Medium Priority (Should Have)
**Integration & Format Support:**
- Cross-format consistency (same logical schema produces equivalent results)
- TBLS JSON parser for MySQL/PostgreSQL database support
- WASM-based Rails schema.rb parsing
- Prisma to PostgreSQL type conversion accuracy

**Error Handling Scenarios:**
- Parser error recovery and meaningful error messages
- Invalid schema format detection
- Large schema file handling (performance edge cases)
- Malformed input sanitization

#### 7.1.3 Low Priority (Nice to Have)
**Advanced Features:**
- Performance optimization for very large schemas (1000+ tables)
- Memory usage optimization
- Fuzzing tests for security validation
- Parser performance benchmarks

### 7.2 Test Types and Coverage
#### 7.2.1 Coverage Requirements
- **Unit Tests**: 90% minimum coverage for parser core logic
- **Integration Tests**: 100% coverage for critical parsing workflows
- **Parser Tests**: All supported formats with real-world examples
- **Schema Validation**: Type checking and constraint validation tests

#### 7.2.2 Test Distribution
- **Parser modules**: Each format parser (postgres, prisma, schemarb, tbls)
- **Schema operations**: Diffing, merging, and decompilation functions
- **Utility functions**: Relationship extraction and type conversion
- **Error scenarios**: Invalid input handling and recovery

### 7.3 Validation Criteria
- **Accuracy**: Test against official database documentation examples
- **Regression**: All reported bugs have corresponding test cases
- **Performance**: Parsing benchmarks for typical schema sizes
- **Security**: Input validation and sanitization effectiveness
