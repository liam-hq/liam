# Reusable patterns and rules for database schema design

## Structural Modeling Patterns
- Models should clearly define foreign key relationships with appropriate constraints to maintain referential integrity.

## Preferred Types
- Use ENUM types for fields that have a limited set of valid values, such as categories and severities, to promote consistency.

## Canonical Design Choices
- Ensure that fields intended to be unique, like `email`, have UNIQUE constraints to maintain data integrity.
- Avoid redundant fields, such as `repositoryName`, to reduce complexity and prevent data anomalies.