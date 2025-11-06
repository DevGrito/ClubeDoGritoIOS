-- Initialization script for PostgreSQL database
-- This script will be run when the database container starts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables will be created by Drizzle migrations
-- This file is just for extensions and initial setup

-- Set timezone
SET timezone = 'America/Sao_Paulo';

-- Create database if it doesn't exist (this is mainly for reference)
-- The database should already be created by the container