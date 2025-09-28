# How to Verify bealigned.app Domain in Resend

## Current Status
- Emails are currently being sent from `onboarding@resend.dev` (Resend's test address)
- Once domain is verified, emails will come from `noreply@bealigned.app`

## Steps to Verify Your Domain

### 1. Add Domain to Resend
1. Go to [Resend Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter: `bealigned.app`
4. Select region (recommend US East)
5. Click **"Add"**

### 2. Add DNS Records
Resend will show you DNS records to add. You'll need to add these to your domain registrar (where you bought bealigned.app).

#### Required DNS Records:

**MX Record** (for receiving emails):
- Type: `MX`
- Name: `send` (creates send.bealigned.app)
- Value: `feedback-smtp.us-east-1.amazonses.com`
- Priority: `10`

**TXT Records** (3 records for DKIM authentication):
Resend will provide 3 CNAME records that look like:
- `resend._domainkey.bealigned.app` → `[unique-value].dkim.amazonses.com`
- `resend2._domainkey.bealigned.app` → `[unique-value].dkim.amazonses.com`
- `resend3._domainkey.bealigned.app` → `[unique-value].dkim.amazonses.com`

**SPF Record** (allows Resend to send on your behalf):
- Type: `TXT`
- Name: `@` or blank
- Value: `v=spf1 include:amazonses.com ~all`

### 3. Common Domain Registrars

#### GoDaddy
1. Log in to [GoDaddy](https://www.godaddy.com)
2. Go to "My Products" → Select your domain
3. Click "DNS" or "Manage DNS"
4. Add the records above

#### Namecheap
1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to "Domain List" → Click "Manage" next to bealigned.app
3. Go to "Advanced DNS" tab
4. Add the records above

#### Cloudflare
1. Log in to [Cloudflare](https://dash.cloudflare.com)
2. Select your domain
3. Go to "DNS" tab
4. Add the records above
5. **Important**: Set proxy status to "DNS only" (gray cloud) for MX and TXT records

#### Google Domains / Squarespace Domains
1. Log in to your account
2. Select your domain
3. Go to "DNS" settings
4. Add custom records

### 4. Verify in Resend
1. After adding DNS records, return to [Resend Domains](https://resend.com/domains)
2. Click **"Verify DNS records"** next to your domain
3. Status should change from "Pending" to "Verified"
   - This can take 5 minutes to 48 hours depending on DNS propagation
   - Usually happens within 30 minutes

### 5. Update the Code
Once verified, update the Edge Function to use your domain:

File: `/supabase/functions/send-transcript/index.ts`

Change:
```typescript
from: 'BeAligned <onboarding@resend.dev>',
```

To:
```typescript
from: 'BeAligned <noreply@bealigned.app>',
```

Then redeploy:
```bash
SUPABASE_ACCESS_TOKEN=sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d \
supabase functions deploy send-transcript --project-ref qujysevuyhqyitxqctxg
```

## Testing
While domain is pending verification:
- Emails will be sent from `onboarding@resend.dev`
- They may go to spam folder
- Subject will still say "Your BeAligned Transcript"

After verification:
- Emails will come from `noreply@bealigned.app`
- Better deliverability
- Professional appearance

## Troubleshooting

### DNS Not Verifying
- Check DNS propagation: https://dnschecker.org
- Ensure records are exactly as Resend provided
- Wait up to 48 hours for propagation
- Contact Resend support if still not working

### Emails Still Going to Spam
- Complete domain verification first
- Add DMARC record: `v=DMARC1; p=none; rua=mailto:admin@bealigned.app`
- Gradually increase sending volume (domain warming)

## Current Workaround
The app is configured to use `onboarding@resend.dev` until your domain is verified. This allows transcript emails to be sent immediately, though they may appear less professional and might go to spam folders.