# Database Design Anti-Patterns

Database anti-patterns are common but problematic approaches to database design that can lead to performance issues, maintenance difficulties, and data integrity problems. This document outlines key anti-patterns to avoid.

## Schema Design Anti-Patterns

### Entity-Attribute-Value (EAV)
- **Problem**: Storing attributes as rows instead of columns to create a "flexible schema"
- **Issues**: Poor query performance, loss of type safety, complex queries
- **Better approach**: Use proper table design with appropriate columns, or consider a document database if schema flexibility is truly needed

### Single Table Inheritance
- **Problem**: Storing multiple entity types in one table with a "type" column
- **Issues**: Wasted space, nullable columns, complex queries
- **Better approach**: Table per concrete class, table per subclass with joins, or proper inheritance if your database supports it

### Multi-Purpose Primary Keys
- **Problem**: Using meaningful business data as primary keys
- **Issues**: Business data may change, complicating updates
- **Better approach**: Use surrogate keys (auto-incrementing IDs or UUIDs)

### Overloaded Columns
- **Problem**: Using the same column to store different types of data
- **Issues**: Type confusion, complex application logic, difficult querying
- **Better approach**: Create separate columns for different data types

## Relationship Anti-Patterns

### Polymorphic Associations
- **Problem**: Foreign keys that can reference multiple tables
- **Issues**: Lack of referential integrity, complex queries
- **Better approach**: Junction tables or concrete foreign keys

### Adjacency List for Hierarchies
- **Problem**: Simple parent-child relationships for deep hierarchies
- **Issues**: Requires recursive queries, poor performance for deep trees
- **Better approach**: Closure table, nested sets, or materialized path for complex hierarchies

### Fear of Joins
- **Problem**: Denormalizing excessively to avoid joins
- **Issues**: Data redundancy, update anomalies
- **Better approach**: Proper normalization with strategic denormalization where needed

## Data Storage Anti-Patterns

### Comma-Separated Values
- **Problem**: Storing lists as comma-separated strings in a single column
- **Issues**: Violates 1NF, difficult to query, integrity issues
- **Better approach**: Junction tables for many-to-many relationships

### BLOB for Everything
- **Problem**: Storing structured data as BLOBs or JSON
- **Issues**: Can't query efficiently, no schema validation
- **Better approach**: Proper relational design, or use document DB if appropriate

### One Size Fits All
- **Problem**: Using the same database design for OLTP and OLAP workloads
- **Issues**: Performance compromises, complex schemas
- **Better approach**: Separate operational and analytical databases

## Performance Anti-Patterns

### Lack of Indexing
- **Problem**: Missing indexes on frequently queried columns
- **Issues**: Poor query performance, excessive table scans
- **Better approach**: Analyze query patterns and add appropriate indexes

### Over-Indexing
- **Problem**: Adding indexes to every column "just in case"
- **Issues**: Slower writes, wasted storage, index maintenance overhead
- **Better approach**: Index based on actual query patterns

### SELECT *
- **Problem**: Retrieving all columns when only a few are needed
- **Issues**: Unnecessary I/O, network traffic, and memory usage
- **Better approach**: Select only the columns you need

## Application Interaction Anti-Patterns

### N+1 Queries
- **Problem**: Executing a query for each result of a previous query
- **Issues**: Excessive database roundtrips, poor performance
- **Better approach**: Use joins, EXISTS clauses, or batch operations

### Database as a Queue
- **Problem**: Using database tables for job queues or messaging
- **Issues**: Polling overhead, locking issues, scaling problems
- **Better approach**: Use dedicated message queues or job systems

### Application-Level Transactions
- **Problem**: Managing transaction logic in application code
- **Issues**: Race conditions, inconsistent state
- **Better approach**: Use database transactions, stored procedures, or ORM transaction support
