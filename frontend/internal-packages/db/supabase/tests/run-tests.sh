#!/bin/bash

# Script to set up and run PostgreSQL RPC function tests

# Check if Supabase CLI is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Please install it first."
    exit 1
fi

PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Check if Supabase is running
pnpm --filter @liam-hq/db exec supabase status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Starting Supabase..."
    pnpm --filter @liam-hq/db exec supabase start
else
    echo "Supabase is already running."
fi

# Set up the testing environment
echo "Setting up the testing environment..."
PGPASSWORD=postgres psql -U postgres -d postgres -h localhost -p 54322 -f "$PROJECT_ROOT/frontend/internal-packages/db/supabase/setup-testing.sql"

# Change to the directory with the tests
cd "$PROJECT_ROOT/frontend/internal-packages/db/supabase"

# Run the tests
echo "Running tests..."
pnpm --filter @liam-hq/db exec supabase test db

echo "Tests completed."
