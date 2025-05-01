# PostgreSQL JSON Types

PostgreSQL provides two JSON data types: `json` and `jsonb`. These types allow you to store JSON (JavaScript Object Notation) data in your database.

## JSON vs JSONB

### JSON Type
- Stores an exact copy of the input text
- Preserves whitespace, duplicate keys, and key order
- Processing functions must reparse the data on each execution
- Slower for operations that process the data

### JSONB Type
- Stores data in a decomposed binary format
- Removes whitespace and duplicate keys (last value is kept)
- Does not preserve key order
- Faster to process and supports indexing
- Recommended for most use cases

## Creating Tables with JSON Columns

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  info json,
  data jsonb
);
```

## Inserting JSON Data

```sql
INSERT INTO orders (info, data) VALUES 
('{"customer": "John Doe", "items": [{"product": "Laptop", "price": 1200}]}',
 '{"customer": "John Doe", "items": [{"product": "Laptop", "price": 1200}]}');
```

## Querying JSON Data

### Accessing JSON Values

PostgreSQL provides operators and functions to extract values from JSON:

- `->` operator: Gets a JSON array element or object field as JSON
- `->>` operator: Gets a JSON array element or object field as text
- `#>` operator: Gets a JSON object at the specified path
- `#>>` operator: Gets a JSON object at the specified path as text

```sql
-- Get customer name as text
SELECT info->>'customer' FROM orders;

-- Get first item's product name
SELECT info->'items'->0->>'product' FROM orders;

-- Get price using path
SELECT info#>>'{items,0,price}' FROM orders;
```

### Filtering with JSON

```sql
-- Find orders with a specific customer
SELECT * FROM orders WHERE data->>'customer' = 'John Doe';

-- Find orders containing a specific product
SELECT * FROM orders WHERE data->'items' @> '[{"product": "Laptop"}]';
```

## Indexing JSON Data

For `jsonb` columns, you can create indexes to improve query performance:

### GIN Index for Contains Operator (@>)

```sql
CREATE INDEX idx_orders_data ON orders USING GIN (data);
```

### GIN Index for Specific Path

```sql
CREATE INDEX idx_orders_customer ON orders USING GIN ((data->'customer'));
```

## Modifying JSON Data

PostgreSQL provides functions to modify JSON data:

- `jsonb_set()`: Updates a field in a jsonb value
- `jsonb_insert()`: Inserts a new value into a jsonb array
- `jsonb_strip_nulls()`: Removes fields with null values

```sql
-- Update customer name
UPDATE orders 
SET data = jsonb_set(data, '{customer}', '"Jane Smith"')
WHERE id = 1;
```

## Best Practices

1. Use `jsonb` instead of `json` for most use cases
2. Create appropriate indexes for common query patterns
3. Consider normalizing frequently queried or updated fields into separate columns
4. Use JSON only for data that has a variable structure or is rarely queried by its components
5. Be aware of the performance implications of complex JSON operations on large datasets
