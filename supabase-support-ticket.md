# Supabase Support Ticket - CRITICAL Auth Issue

## Project Information
- Project URL: https://qujysevuyhqyitxqctxg.supabase.co
- Project Ref: qujysevuyhqyitxqctxg

## Issue Description
The authentication system is completely broken with error: "Database error querying schema"

## Root Cause
A custom column `is_super_admin` was accidentally added to the `auth.users` table. This is breaking all authentication operations including:
- User login
- Password reset
- User creation
- Admin user management

## Error Details
- Error code: `unexpected_failure`
- Error message: `Database error querying schema`
- HTTP Status: 500

## Verification
Running this query confirms the problematic column exists:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
AND column_name = 'is_super_admin';
```

Result: Column exists at ordinal_position 19

## Required Fix
We need to remove this column but don't have the necessary permissions:
```sql
ALTER TABLE auth.users DROP COLUMN is_super_admin;
```

Error when attempting: `ERROR: 42501: must be owner of table users`

## Impact
- ALL users cannot log in
- Admin functions are broken
- New user registration fails
- Password reset fails

## Request
Please urgently remove the `is_super_admin` column from the `auth.users` table to restore authentication functionality.

Thank you!