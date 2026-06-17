-- EduAI Ultimate — PostgreSQL initialization script
-- Runs once when the container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Ensure the eduai user has necessary privileges
GRANT ALL PRIVILEGES ON DATABASE eduai_db TO eduai;

-- Set default search path
ALTER USER eduai SET search_path = public;
