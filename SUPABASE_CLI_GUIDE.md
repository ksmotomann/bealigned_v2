# Supabase CLI SQL Execution Guide

## Available Methods for SQL Execution

### Method 1: Migrations (Recommended)
**Best for:** Schema changes, repeatable deployments, version control

```bash
# Create a new migration
npx supabase migration new your_migration_name

# Edit the migration file in supabase/migrations/
# Add your SQL content

# Apply to remote linked project
npx supabase migration up --linked

# Apply to specific database URL
npx supabase migration up --db-url "postgresql://..."
```

**Pros:**
- Version controlled
- Repeatable
- Can be applied to different environments
- Part of proper database schema management

**Cons:**
- Creates permanent migration files
- Not ideal for one-off queries

### Method 2: Direct psql Connection
**Best for:** One-off queries, debugging, manual operations

```bash
# psql is available at: /opt/homebrew/bin/psql
# You need the database connection string from Supabase dashboard

# Example (replace with actual connection string):
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Or execute a file:
psql "postgresql://..." -f your_script.sql

# Or execute inline:
psql "postgresql://..." -c "SELECT version();"
```

**Pros:**
- Direct access
- No migration files created
- Can run any SQL
- Real-time results

**Cons:**
- Requires connection string management
- Not version controlled
- Need to handle credentials securely

### Method 3: Migration with db-url (Hybrid)
**Best for:** Running migration-style SQL without creating permanent migrations

```bash
# Create temporary migration
npx supabase migration new temp_operation

# Add SQL content, then apply with custom db-url
npx supabase migration up --db-url "postgresql://..."

# Delete the migration file afterward if it was temporary
rm supabase/migrations/[timestamp]_temp_operation.sql
```

## Current Project Status

- **Project Linked:** ✅ BeAligned (oohrdabehxzzwdmpmcfv)
- **Migrations Directory:** ✅ supabase/migrations/
- **psql Available:** ✅ /opt/homebrew/bin/psql

## Quick Start Commands

```bash
# Check project status
npx supabase projects list

# List existing migrations
npx supabase migration list

# Apply all pending migrations to remote
npx supabase migration up --linked

# Create new migration for admin setup
npx supabase migration new setup_admin_and_align_code
```

## Example: Testing Connection

```bash
# Test with simple query (once you have connection string)
psql "postgresql://..." -c "SELECT current_user, current_database();"
```

## Security Notes

- Never commit database connection strings to version control
- Use environment variables for sensitive credentials
- Consider using `--linked` flag when possible as it uses existing auth