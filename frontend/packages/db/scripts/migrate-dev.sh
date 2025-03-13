#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: Migration name is required"
  echo "Usage: pnpm migrate:dev <migration_name>"
  exit 1
fi

MIGRATION_NAME=$1

echo "Running Prisma migration with name: $MIGRATION_NAME"
pnpm prisma migrate dev --name $MIGRATION_NAME

if [ $? -ne 0 ]; then
  echo "Error: Prisma migration failed"
  exit 1
fi

# Generate Supabase migration for Supabase Branching
# ref: https://supabase.com/docs/guides/deployment/branching#open-a-pull-request
# > changes the migration files in ./supabase/migrations
echo "Generating Supabase migration with name: $MIGRATION_NAME"
pnpm supabase db diff -f $MIGRATION_NAME

if [ $? -ne 0 ]; then
  echo "Error: Supabase migration failed"
  exit 1
fi

echo "Migration completed successfully!"
