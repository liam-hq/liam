#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: Migration name is required"
  echo "Usage: pnpm migrate:dev <migration-name>"
  exit 1
fi

MIGRATION_NAME=$1

echo "Running Prisma migration..."
pnpm prisma migrate dev --name $MIGRATION_NAME

if [ $? -ne 0 ]; then
  echo "Error: Prisma migration failed"
  exit 1
fi

echo "Generating Supabase migration..."
pnpm supabase db diff --use-migra -f $MIGRATION_NAME

if [ $? -ne 0 ]; then
  echo "Error: Supabase migration failed"
  exit 1
fi

echo "Migration completed successfully!"
