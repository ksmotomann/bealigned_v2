# Supabase Edge Functions Setup

## Email Configuration

### 1. Set up Resend (Free Email Service)
1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add your domain or use their test domain

### 2. Add Resend API Key to Supabase
```bash
# Set the secret in Supabase
SUPABASE_ACCESS_TOKEN=sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d \
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE \
--project-ref qujysevuyhqyitxqctxg
```

### 3. Deploy Functions
```bash
# Deploy the send-transcript function
SUPABASE_ACCESS_TOKEN=sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d \
supabase functions deploy send-transcript \
--project-ref qujysevuyhqyitxqctxg
```

## Available Functions

### send-transcript
- **Purpose**: Send conversation transcripts via email
- **Endpoint**: `https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/send-transcript`
- **Method**: POST
- **Body**:
  ```json
  {
    "conversationId": "uuid",
    "recipientEmail": "user@example.com",
    "userId": "uuid"
  }
  ```

## Testing

Test the function directly:
```bash
curl -L -X POST 'https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/send-transcript' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"conversationId":"test-id","recipientEmail":"test@example.com","userId":"test-user"}'
```

## Migration from Express Backend

The app is transitioning from Express backend to Supabase Edge Functions:

### Old Architecture:
- Frontend (Vercel) → Express Backend (localhost:3001) → Supabase DB

### New Architecture:
- Frontend (Vercel) → Supabase Edge Functions → Supabase DB

### Benefits:
- No separate backend to maintain
- Direct database access (faster)
- Automatic scaling
- Unified auth and RLS
- Lower costs

## Future Functions to Add

1. **system-events** - Log all system events
2. **conversation-complete** - Handle conversation completion
3. **admin-actions** - Admin-specific operations
4. **ai-assistant** - OpenAI integration
5. **github-sync** - GitHub issue synchronization