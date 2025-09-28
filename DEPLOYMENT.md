# Deployment Guide for bealigned.app

## Domain Configuration
- **Production URL**: https://bealigned.app
- **Platform**: Vercel

## Deployment Steps

### 1. Initial Deploy to Vercel
```bash
# From the root directory
vercel --prod
```

### 2. Configure Domain
In Vercel Dashboard:
1. Go to Settings → Domains
2. Add `bealigned.app`
3. Follow DNS configuration instructions

### 3. Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- Copy all variables from `vercel-env-vars.txt`
- Add them for Production, Preview, and Development environments

### 4. Update GitHub Webhook
1. Go to: https://github.com/ksmotomann/bealigned/settings/webhooks
2. Edit the existing webhook (or create new)
3. Update configuration:
   - **Payload URL**: `https://bealigned.app/api/github-sync/webhook`
   - **Secret**: `bealigned-webhook-secret-2024`
   - **Content type**: `application/json`
   - **Events**: Issues, Issue comments
   - **Active**: ✓

### 5. Verify Deployment

#### Check Frontend:
- Visit: https://bealigned.app
- Login with your credentials
- Verify all pages load correctly

#### Check Backend API:
- Health check: https://bealigned.app/api/health
- Should return: `{"status":"ok"}`

#### Check GitHub Sync:
1. Create a test issue on GitHub with "enhancement" label
2. Verify it appears in BeAligned Issues Manager
3. Add a comment on GitHub
4. Verify comment syncs to BeAligned

## Important URLs

### Production
- **App**: https://bealigned.app
- **API**: https://bealigned.app/api
- **GitHub Webhook**: https://bealigned.app/api/github-sync/webhook

### GitHub Repository
- **Code**: https://github.com/ksmotomann/bealigned
- **Issues**: https://github.com/ksmotomann/bealigned/issues
- **Webhook Settings**: https://github.com/ksmotomann/bealigned/settings/webhooks

### Vercel Dashboard
- **Project**: https://vercel.com/your-username/bealigned
- **Environment Variables**: https://vercel.com/your-username/bealigned/settings/environment-variables

## Monitoring

### Check Webhook Deliveries
1. Go to: https://github.com/ksmotomann/bealigned/settings/webhooks
2. Click on your webhook
3. Check "Recent Deliveries" tab
4. Green checkmarks = successful delivery
5. Red X = failed (click to see error details)

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Functions tab → View logs
3. Monitor for any errors

## Troubleshooting

### Webhook Not Working?
1. Check Recent Deliveries in GitHub webhook settings
2. Verify the URL is correct: `https://bealigned.app/api/github-sync/webhook`
3. Check Vercel function logs for errors
4. Ensure GITHUB_TOKEN is valid

### Sync Issues?
1. Verify GITHUB_TOKEN has repo permissions
2. Check that issues have "enhancement" or "feature-request" labels
3. Verify database has correct GitHub sync fields

### API Connection Issues?
1. Check REACT_APP_API_URL is set to `https://bealigned.app`
2. Verify CORS settings in backend
3. Check Vercel function logs

## Security Notes
- Keep GITHUB_TOKEN secure (regenerate if exposed)
- Keep GITHUB_WEBHOOK_SECRET secret
- Rotate Supabase service role key periodically
- Monitor GitHub webhook deliveries for unauthorized attempts