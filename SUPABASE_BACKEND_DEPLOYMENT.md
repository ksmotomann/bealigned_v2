# Deploy Backend to Supabase Edge Functions

## Option 1: Supabase Edge Functions (Recommended for Consolidation)

Supabase Edge Functions can replace your Express backend. Here's how:

### Step 1: Install Supabase CLI
```bash
brew install supabase/tap/supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Initialize Supabase in your project
```bash
supabase init
```

### Step 4: Create Edge Functions
```bash
# Create functions for each route
supabase functions new auth
supabase functions new conversations
supabase functions new messages
supabase functions new admin
```

### Step 5: Deploy Functions
```bash
supabase functions deploy auth --project-ref qujysevuyhqyitxqctxg
supabase functions deploy conversations --project-ref qujysevuyhqyitxqctxg
```

### Step 6: Update Frontend API URLs
```javascript
// Instead of http://localhost:3001/api/auth
// Use: https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/auth
```

## Option 2: Vercel Serverless Functions

You can convert your Express backend to Vercel Serverless Functions:

### Step 1: Create API Directory
```
/api
  /auth.ts
  /conversations.ts
  /messages.ts
  /admin.ts
```

### Step 2: Convert Express Routes to Serverless Functions
Example `/api/auth.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'POST') {
    // Handle login
  } else if (req.method === 'GET') {
    // Handle user info
  }
}
```

### Step 3: Update vercel.json
```json
{
  "functions": {
    "api/*.ts": {
      "maxDuration": 10
    }
  }
}
```

## Option 3: Keep Express Backend on Vercel (Quickest)

Deploy your existing Express backend as a Vercel Serverless Function:

### Step 1: Create /api/index.ts
```typescript
import app from '../backend/dist/server';
export default app;
```

### Step 2: Update vercel.json
```json
{
  "buildCommand": "cd frontend && npm install && npm run build && cd ../backend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "framework": "create-react-app",
  "functions": {
    "api/index.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

## Recommendation

**For fastest deployment with minimal changes:**
- Use **Option 3** - Deploy Express backend to Vercel as serverless function
- This requires minimal code changes
- Everything stays in Vercel

**For best integration with Supabase:**
- Use **Option 1** - Supabase Edge Functions
- Better integration with your database
- Built-in authentication handling

**For most scalable:**
- Use **Option 2** - Convert to Vercel Serverless Functions
- Best performance
- Most work to convert

## Environment Variables for Any Option

Add these to Vercel or Supabase:
```
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_005JPwm8PCxy9gJh5B3O5Fo4
SUPABASE_URL=https://qujysevuyhqyitxqctxg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
USE_CHAT_COMPLETION=true
```