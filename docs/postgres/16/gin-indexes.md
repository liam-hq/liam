# PostgreSQL GIN Indexes

GIN (Generalized Inverted Index) is a specialized index type in PostgreSQL designed for handling cases where multiple values are stored in a single column, such as arrays, jsonb, and full-text search.

## When to Use GIN Indexes

GIN indexes are particularly useful for:

1. Full-text search on `tsvector` columns
2. Queries on array columns using operators like `@>`, `&&`, `<@`
3. `jsonb` columns with containment and path operations
4. Any data type with appropriate operator classes

## How GIN Indexes Work

GIN indexes store each element of a composite value (like an array or JSON document) as a separate key in the index, with a list of row IDs where that element appears. This structure allows for efficient lookups when searching for specific elements.

Unlike B-tree indexes, GIN indexes can handle queries that search for values within composite structures, making them ideal for complex data types.

## Creating GIN Indexes

### Basic Syntax

```sql
CREATE INDEX index_name ON table_name USING GIN (column_name);
```

### For Array Columns

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  tags TEXT[]
);

-- Create GIN index on the tags array column
CREATE INDEX idx_products_tags ON products USING GIN (tags);
```

### For JSONB Columns

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  data JSONB
);

-- Create GIN index on the entire JSONB column
CREATE INDEX idx_documents_data ON documents USING GIN (data);

-- Create GIN index for specific operations (jsonb_path_ops)
CREATE INDEX idx_documents_data_path ON documents USING GIN (data jsonb_path_ops);
```

### For Full-Text Search

```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT,
  body TEXT,
  search_vector TSVECTOR
);

-- Create GIN index on the tsvector column
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);
```

## GIN Index Operators

Different data types support different operators with GIN indexes:

### Array Operators

- `@>` (contains): `array1 @> array2` (true if array1 contains array2)
- `<@` (is contained by): `array1 <@ array2` (true if array1 is contained by array2)
- `&&` (overlap): `array1 && array2` (true if arrays have common elements)

### JSONB Operators

- `@>` (contains): `jsonb_column @> '{"key": "value"}'`
- `?` (key exists): `jsonb_column ? 'key'`
- `?|` (any key exists): `jsonb_column ?| array['key1', 'key2']`
- `?&` (all keys exist): `jsonb_column ?& array['key1', 'key2']`

### Full-Text Search Operators

- `@@` (matches): `search_vector @@ to_tsquery('search & terms')`
- `@@@` (matches with highlighting): `search_vector @@@ to_tsquery('search & terms')`

## GIN Index Options

GIN indexes support several options to tune their behavior:

### Operator Classes

- `array_ops` (default for arrays)
- `jsonb_ops` (default for jsonb)
- `jsonb_path_ops` (optimized for `@>` operator on jsonb)
- `tsvector_ops` (default for tsvector)

### Storage Parameters

```sql
CREATE INDEX idx_name ON table_name USING GIN (column_name) WITH (
  fastupdate = on,
  gin_pending_list_limit = 4MB
);
```

- `fastupdate`: Controls the fast update technique (default: on)
- `gin_pending_list_limit`: Maximum size of the pending list (default: 4MB)

## Performance Considerations

1. **Size**: GIN indexes can be larger than B-tree indexes because they store each element separately
2. **Build Time**: GIN indexes take longer to build initially
3. **Update Performance**: Updates can be slower, especially with `fastupdate=off`
4. **Query Performance**: Extremely fast for containment and overlap queries

## Best Practices

1. Use GIN indexes when you need to search within composite structures
2. Consider `jsonb_path_ops` for jsonb columns if you only use the `@>` operator
3. Monitor index size and adjust `gin_pending_list_limit` if needed
4. Be aware that GIN indexes can be larger than B-tree indexes
5. For very large tables, consider building the index with `fastupdate=off` to reduce initial build time
6. Use partial indexes to reduce index size if you only query a subset of rows
