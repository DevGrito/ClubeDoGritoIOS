#!/bin/bash

# Entrypoint script for backend container
# Runs database migrations before starting the application

set -e

echo "🚀 Starting Backend Container..."

# Function to wait for database
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  
  # Extract database details from DATABASE_URL
  if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL environment variable not set"
    exit 1
  fi

  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+):[0-9]+/.*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')

  # Fallbacks
  DB_HOST=${DB_HOST:-"clubedogrito_db"}
  DB_PORT=${DB_PORT:-"5432"}

  echo "🔍 Checking database at ${DB_HOST}:${DB_PORT}"

  timeout=60
  count=0

  while [ $count -lt $timeout ]; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
      echo "✅ Database is ready!"
      # Try real connection
      if node -e "
        const { Client } = require('pg');
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        client.connect()
          .then(() => client.query('SELECT 1'))
          .then(() => {
            console.log('✅ Database connection verified');
            client.end();
          })
          .catch(err => {
            console.error('❌ Database connection failed:', err.message);
            process.exit(1);
          });
      "; then
        return 0
      fi
    fi

    echo "⏳ Database not ready yet, retrying in 2 seconds... ($((count+1))/$timeout)"
    sleep 2
    count=$((count + 1))
  done

  echo "❌ Timeout waiting for database to be ready"
  exit 1
}

# Function to run database migrations
run_migrations() {
  echo "🔄 Running database migrations..."
  if npm run db:push; then
    echo "✅ Database migrations completed successfully"
  else
    echo "❌ Database migrations failed"
    exit 1
  fi
}

# Function to check required environment variables
check_env_vars() {
  echo "🔍 Checking required environment variables..."
  required_vars=(
    "DATABASE_URL"
    "STRIPE_SECRET_KEY"
    "NODE_ENV"
  )

  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      echo "❌ Required environment variable $var is not set"
      exit 1
    fi
  done
  echo "✅ All required environment variables are set"
}

# Function to start the application
start_application() {
  echo "🎯 Starting the application..."
  if [[ "$NODE_ENV" == "production" ]]; then
    echo "🚀 Starting in production mode..."
    exec node dist/index.js
  else
    echo "🔧 Starting in development mode..."
    exec npm run dev
  fi
}

# Main execution flow
main() {
  echo "============================================"
  echo "🌟 CLUBE DO GRITO - Backend Container"
  echo "============================================"

  check_env_vars
  wait_for_db
  run_migrations

  echo "✅ Initialization complete!"
  echo "============================================"

  start_application
}

# Handle signals for graceful shutdown
trap 'echo "📴 Received shutdown signal, exiting..."; exit 0' SIGTERM SIGINT

main "$@"
