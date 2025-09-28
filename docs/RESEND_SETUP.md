# Resend Email Configuration for BeAligned

## Quick Setup

### 1. Get Your Resend API Key
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key with "Full Access" permissions
3. Copy the key (starts with `re_`)

### 2. Deploy to Supabase
Run the deployment script:
```bash
cd /Users/robertmann/Projects/bealigned-lite
./scripts/deploy-resend-email.sh
```

Enter your Resend API key when prompted.

### 3. Add Your Domain to Resend
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `bealigned.app`
4. Resend will provide DNS records

### 4. Configure DNS Records

Add these records to your domain's DNS (through your domain registrar):

#### SPF Record (Allows Resend to send emails)
- **Type**: TXT
- **Name**: @ (or leave blank)
- **Value**: `v=spf1 include:spf.resend.com ~all`

#### DKIM Records (Email authentication)
Resend will provide 3 CNAME records like:
- **resend._domainkey** → resend.domainkey.xxxxx.domains.resend.com
- **resend2._domainkey** → resend.domainkey.xxxxx.domains.resend.com  
- **resend3._domainkey** → resend.domainkey.xxxxx.domains.resend.com

#### DMARC Record (Optional but recommended)
- **Type**: TXT
- **Name**: _dmarc
- **Value**: `v=DMARC1; p=quarantine; rua=mailto:admin@bealigned.app`

### 5. Verify Domain
1. After adding DNS records, return to Resend dashboard
2. Click "Verify DNS Records"
3. Status should change to "Verified" (may take up to 48 hours)

## Email Addresses Used

- **From**: noreply@bealigned.app (automated emails)
- **Reply-To**: support@bealigned.app (user replies)
- **Transcripts**: transcripts@bealigned.app (conversation transcripts)

## Testing

### Test Send Transcript Function
```javascript
// In browser console while logged in
const response = await fetch('https://qujysevuyhqyitxqctxg.supabase.co/functions/v1/send-transcript', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YOUR_ACCESS_TOKEN}`,
  },
  body: JSON.stringify({
    conversationId: 'YOUR_CONVERSATION_ID',
    recipientEmail: 'test@example.com',
    userId: 'YOUR_USER_ID'
  })
});
console.log(await response.json());
```

## Monitoring

### Check Email Status in Resend
1. Go to [Resend Emails](https://resend.com/emails)
2. View sent emails, bounces, and delivery status

### Check Supabase Function Logs
```bash
supabase functions logs send-transcript --project-ref qujysevuyhqyitxqctxg
```

## Troubleshooting

### Domain Not Verified
- DNS propagation can take up to 48 hours
- Check DNS records with: `dig TXT bealigned.app`
- Ensure records match exactly what Resend provided

### Emails Going to Spam
1. Complete domain verification
2. Set up SPF, DKIM, and DMARC records
3. Warm up domain by sending gradually increasing volumes

### API Key Issues
```bash
# Update the API key
supabase secrets set RESEND_API_KEY="your_new_key" --project-ref qujysevuyhqyitxqctxg
```

### Function Not Working
```bash
# Redeploy the function
cd /Users/robertmann/Projects/bealigned-lite/supabase/functions
supabase functions deploy send-transcript --project-ref qujysevuyhqyitxqctxg
```

## Production Checklist

- [ ] Resend API key configured
- [ ] Domain added to Resend
- [ ] SPF record added
- [ ] DKIM records added
- [ ] DMARC record added (optional)
- [ ] Domain verified in Resend
- [ ] Edge Functions deployed
- [ ] Test email sent successfully
- [ ] Email templates customized in Supabase Auth settings