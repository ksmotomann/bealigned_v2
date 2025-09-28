# GitHub Webhook Setup for BeAligned

## Production Setup

1. Go to: https://github.com/ksmotomann/bealigned/settings/webhooks
2. Click "Add webhook"
3. Configure:
   - Payload URL: `https://your-domain.com/api/github-sync/webhook`
   - Content type: `application/json`
   - Secret: `bealigned-webhook-secret-2024`
   - Events: Issues, Issue comments
   - Active: ✓

## Local Development Setup (using ngrok)

1. Install ngrok:
   ```bash
   brew install ngrok
   ```

2. Start ngrok tunnel:
   ```bash
   ngrok http 3001
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Use this URL in GitHub webhook:
   - Payload URL: `https://abc123.ngrok.io/api/github-sync/webhook`

## What Gets Synced

### From GitHub → BeAligned:
- New issues with "enhancement" label
- Issue status changes (open/closed)
- Issue edits (title, description)
- New comments on synced issues

### From BeAligned → GitHub:
- Feature and improvement issues
- Status updates
- Comments
- Priority labels

## Testing the Webhook

1. Create a test issue on GitHub with "enhancement" label
2. Check BeAligned Issues Manager - it should appear
3. Add a comment on GitHub
4. Check BeAligned - comment should sync

## Current Sync Status

✅ Synced to GitHub:
- Issue #1: do something
- Issue #2: Sync with GitHub

View on GitHub: https://github.com/ksmotomann/bealigned/issues
