#!/usr/bin/env node

/**
 * Digital Ocean Database Migration Runner
 * 
 * This script runs drizzle-kit commands against the Digital Ocean PostgreSQL database
 * instead of the default Neon database. It overrides DATABASE_URL at runtime.
 * 
 * Usage:
 *   node scripts/run-do-migrations.mjs push        # Apply schema changes
 *   node scripts/run-do-migrations.mjs generate    # Generate migrations
 *   node scripts/run-do-migrations.mjs studio      # Open Drizzle Studio
 */

import { spawn } from 'child_process';

const { DO_DB_HOST, DO_DB_PORT, DO_DB_USER, DO_DB_PASSWORD, DO_DB_NAME } = process.env;

if (!DO_DB_HOST || !DO_DB_PORT || !DO_DB_USER || !DO_DB_PASSWORD || !DO_DB_NAME) {
  console.error('❌ Missing required DO_DB_* environment variables');
  console.error('Required: DO_DB_HOST, DO_DB_PORT, DO_DB_USER, DO_DB_PASSWORD, DO_DB_NAME');
  process.exit(1);
}

const doConnectionString = `postgresql://${DO_DB_USER}:${encodeURIComponent(DO_DB_PASSWORD)}@${DO_DB_HOST}:${DO_DB_PORT}/${DO_DB_NAME}`;

const command = process.argv[2] || 'push';
const additionalArgs = process.argv.slice(3);

console.log(`🔌 Connecting to Digital Ocean PostgreSQL (${DO_DB_HOST}:${DO_DB_PORT}/${DO_DB_NAME})`);
console.log(`🚀 Running: drizzle-kit ${command} ${additionalArgs.join(' ')}`);

const drizzleProcess = spawn('npx', ['drizzle-kit', command, ...additionalArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: doConnectionString
  }
});

drizzleProcess.on('close', (code) => {
  if (code === 0) {
    console.log(`✅ Migration command completed successfully`);
  } else {
    console.error(`❌ Migration command failed with code ${code}`);
    process.exit(code);
  }
});
