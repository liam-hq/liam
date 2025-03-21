#!/bin/bash

# Set output directory for schema DDL
OUTPUT_DIR="frontend/packages/db/schema"
SCHEMA_FILE="$OUTPUT_DIR/schema.sql"

# Create output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

echo "Generating complete schema DDL using pg_dump..."

# Get Supabase database connection info
DB_URL=$(pnpm supabase status | grep "DB URL" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
  echo "Error: Could not retrieve database URL from Supabase"
  echo "Make sure Supabase is running with 'pnpm supabase start'"
  exit 1
fi

# Use pg_dump to output schema only (no data)
# --schema=public to target only the public schema
# --schema-only to output only schema definitions
# --no-owner to omit ownership information
pg_dump "$DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner \
  > "$SCHEMA_FILE"

if [ $? -ne 0 ]; then
  echo "Error: pg_dump failed to generate schema DDL"
  exit 1
fi

echo "Schema DDL successfully generated at $SCHEMA_FILE"
