# Supabase CLI Database Queries

## Setup (One-time)

Your project uses the **new Supabase key format** (publishable/secret keys), not legacy anon/service_role keys.

**Keys stored in:**
- `.env.local` - Secret key (local CLI queries only, gitignored)
- `.env` - Publishable key (client-side app)

## Query Database via CLI

### Method 1: Using Node.js Script (Recommended)

```bash
# Query phase_prompts table
node query-phase-prompts.mjs

# Run any custom query - edit the script first
node query-phase-prompts.mjs
```

### Method 2: Supabase Dashboard
https://supabase.com/dashboard/project/oohrdabehxzzwdmpmcfv/editor

## Common Queries

### View phase_prompts table:
```javascript
const { data } = await supabase
  .from('phase_prompts')
  .select('*')
  .order('phase_number')
```

### Update a phase:
```javascript
const { data } = await supabase
  .from('phase_prompts')
  .update({ phase_header: 'NEW HEADER' })
  .eq('phase_number', 1)
  .select()
```

## Important Notes

1. **Governance Location:** All AI governance is now in `supabase/functions/chat/prompts.ts` (embedded constants)
2. **Database `ai_guidance` field:** Set to NULL (not used)
3. **Secret Key:** Never commit to git - stored in `.env.local` which is gitignored

## Troubleshooting

### "Legacy API keys are disabled"
- You tried using old anon/service_role keys
- Use the secret key from `.env.local` instead

### "Invalid API key"
- Check that you're using the **secret key** (starts with `sb_secret_`)
- Not the publishable key (starts with `sb_publishable_`)

### Can't connect with psql
- Pooler authentication doesn't work with new key format
- Use Node.js script with @supabase/supabase-js instead
