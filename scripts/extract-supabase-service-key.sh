#!/bin/bash

# Execute the supabase status command and capture its output
STATUS_OUTPUT=$(pnpm --filter @liam-hq/db exec supabase status)

# Extract the service role key from the output
# Using a precise grep pattern to match only the service role key line
SERVICE_KEY_LINE=$(echo "$STATUS_OUTPUT" | grep -m 1 "service_role key:")

# Clean up and extract just the key
# Remove "service_role key: " prefix
SERVICE_KEY=$(echo "$SERVICE_KEY_LINE" | sed 's/.*service_role key: \(.*\)/\1/' | tr -d ' ')

if [ -z "$SERVICE_KEY" ]; then
  echo "Failed to extract the service role key from Supabase status output"
  exit 1
fi

echo "Extracted service role key: $SERVICE_KEY"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "error: .env file does not exist"
  exit 1
fi

# Check if SUPABASE_SERVICE_ROLE_KEY already exists in .env
if grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env; then
  # Replace the existing line
  sed -i.bak "s/SUPABASE_SERVICE_ROLE_KEY=.*/SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY/" .env
  rm -f .env.bak
  echo "Updated SUPABASE_SERVICE_ROLE_KEY in .env file"
else
  # Append the new line
  echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .env
  echo "Added SUPABASE_SERVICE_ROLE_KEY to .env file"
fi 