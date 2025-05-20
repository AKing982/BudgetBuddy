#!/bin/bash
set -e

exists=$(psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='budgetbuddyapp'")

# Create database if it doesn't exist
if [ -z "$exists" ]; then
  echo "Creating database budgetbuddyapp"
  psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE budgetbuddyapp"
else
  echo "Database budgetbuddyapp already exists"
fi