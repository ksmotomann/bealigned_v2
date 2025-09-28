# BeAligned Development Environment Setup

This guide explains how to set up and use a local development environment to avoid making changes directly to production.

## Current Setup

- **Production**: Supabase project at `qujysevuyhqyitxqctxg.supabase.co`
- **Local Development**: Can be run using Supabase CLI with Docker

## Local Development Setup

### Prerequisites

1. **Docker Desktop** must be installed and running
2. **Supabase CLI** installed (`npm install -g supabase`)

### Starting Local Development

```bash
# 1. Start local Supabase services (PostgreSQL, Auth, Storage, Functions)
supabase start

# This will give you local URLs:
# - API URL: http://localhost:54321
# - GraphQL URL: http://localhost:54321/graphql/v1
# - Database URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Inbucket URL: http://localhost:54324 (email testing)
# - JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
# - anon key: (will be displayed)
# - service_role key: (will be displayed)
```

### Environment Configuration

Create two environment files:

#### `.env.local` (for local development)
```env
# Frontend (.env.local)
REACT_APP_SUPABASE_URL=http://localhost:54321
REACT_APP_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
REACT_APP_API_URL=http://localhost:3001

# Backend (.env.local)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

#### `.env.production` (for production)
```env
# Frontend (.env.production)
REACT_APP_SUPABASE_URL=https://qujysevuyhqyitxqctxg.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<production-anon-key>
REACT_APP_API_URL=https://qujysevuyhqyitxqctxg.supabase.co/functions/v1

# Keep production credentials secure
```

## Database Migrations

### Creating Migrations

```bash
# Create a new migration
supabase migration new <migration_name>

# Example:
supabase migration new add_user_preferences
```

### Applying Migrations

```bash
# Apply to local database
supabase db reset  # This resets and applies all migrations

# Push to production (after testing locally)
supabase db push --project-ref qujysevuyhqyitxqctxg
```

### Pulling Production Schema

```bash
# Pull current production schema to local
supabase db pull --project-ref qujysevuyhqyitxqctxg

# This creates migrations for any production changes
```

## Edge Functions Development

### Local Testing

```bash
# Serve functions locally
supabase functions serve

# Deploy function to local environment
supabase functions deploy <function-name> --local

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/invites' \
  --header 'Authorization: Bearer <anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'
```

### Deploying to Production

```bash
# Deploy specific function
SUPABASE_ACCESS_TOKEN=sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d \
  supabase functions deploy <function-name> --project-ref qujysevuyhqyitxqctxg

# Deploy all functions
SUPABASE_ACCESS_TOKEN=sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d \
  supabase functions deploy --project-ref qujysevuyhqyitxqctxg
```

## Development Workflow

### Recommended Workflow

1. **Always start with local development**
   ```bash
   supabase start
   ```

2. **Make database changes via migrations**
   ```bash
   supabase migration new <change_description>
   # Edit the migration file in supabase/migrations/
   supabase db reset  # Apply to local
   ```

3. **Test Edge Functions locally**
   ```bash
   supabase functions serve
   ```

4. **Run the application with local backend**
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   npm start

   # Terminal 2 - Backend (if using separate backend)
   cd backend
   npm run dev
   ```

5. **After testing, push to production**
   ```bash
   # Database changes
   supabase db push --project-ref qujysevuyhqyitxqctxg
   
   # Edge Functions
   SUPABASE_ACCESS_TOKEN=sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d \
     supabase functions deploy --project-ref qujysevuyhqyitxqctxg
   ```

## Switching Between Environments

### Using Environment Variables

```bash
# Local development
npm run start:local  # Uses .env.local

# Production build
npm run build:prod   # Uses .env.production
```

### Add to package.json

```json
{
  "scripts": {
    "start:local": "REACT_APP_ENV=local react-scripts start",
    "start:prod": "REACT_APP_ENV=production react-scripts start",
    "build:local": "REACT_APP_ENV=local react-scripts build",
    "build:prod": "REACT_APP_ENV=production react-scripts build"
  }
}
```

## Database Branching (Beta Feature)

Supabase now supports database branching for isolated development:

```bash
# Create a development branch
supabase branches create dev-branch --project-ref qujysevuyhqyitxqctxg

# List branches
supabase branches list --project-ref qujysevuyhqyitxqctxg

# Switch to branch
supabase branches switch dev-branch --project-ref qujysevuyhqyitxqctxg

# Delete branch
supabase branches delete dev-branch --project-ref qujysevuyhqyitxqctxg
```

## Seeding Local Database

Create seed data in `supabase/seed.sql`:

```sql
-- Insert test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', crypt('password123', gen_salt('bf')), NOW());

-- Insert test profiles
INSERT INTO profiles (id, email, first_name, last_name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'Test', 'User');
```

Apply seeds:
```bash
supabase db reset  # This applies migrations and seeds
```

## Email Testing

Local development includes Inbucket for email testing:
- Access at: http://localhost:54324
- All emails sent locally are captured here
- No actual emails are sent

## Important Notes

1. **Never commit `.env.local` or `.env.production` files** - Add them to `.gitignore`
2. **Always test migrations locally first** before applying to production
3. **Use meaningful migration names** that describe the change
4. **Keep production credentials secure** - Use environment variables
5. **Document breaking changes** in migration files

## Troubleshooting

### Docker not running
```bash
# Start Docker Desktop first, then:
supabase start
```

### Port conflicts
```bash
# Stop local Supabase
supabase stop

# Start with different ports
supabase start --port 54320
```

### Reset local database
```bash
supabase db reset
```

### View logs
```bash
supabase logs  # All services
supabase logs auth  # Specific service
```

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/managing-migrations)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)