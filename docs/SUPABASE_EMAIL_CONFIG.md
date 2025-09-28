# Configuring Custom Email Domain for Supabase Auth

## Steps to Configure Custom Email Domain (@bealigned.app)

### 1. Set Up Email Service Provider
You'll need an email service provider that supports transactional emails. Popular options:
- **SendGrid** (recommended by Supabase)
- **Resend** 
- **Postmark**
- **Amazon SES**

### 2. Configure SMTP in Supabase Dashboard

1. Go to your Supabase project dashboard: https://app.supabase.com/project/qujysevuyhqyitxqctxg
2. Navigate to **Authentication** → **Email Templates**
3. Click on **SMTP Settings**
4. Enable "Custom SMTP"
5. Enter your SMTP credentials:
   - **Host**: Your SMTP server (e.g., smtp.sendgrid.net)
   - **Port**: Usually 587 for TLS or 465 for SSL
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password/API key
   - **Sender email**: noreply@bealigned.app
   - **Sender name**: BeAligned

### 3. Update Email Templates

In the same Email Templates section, customize each template:

#### Confirmation Email Template
```html
<h2>Welcome to BeAligned</h2>
<p>Thank you for signing up! Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't create an account with BeAligned, you can safely ignore this email.</p>
<p>Best regards,<br>The BeAligned Team</p>
```

#### Magic Link Template
```html
<h2>Sign in to BeAligned</h2>
<p>Click the link below to sign in to your BeAligned account:</p>
<p><a href="{{ .MagicLink }}">Sign in to BeAligned</a></p>
<p>This link will expire in 1 hour.</p>
<p>Best regards,<br>The BeAligned Team</p>
```

#### Password Reset Template
```html
<h2>Reset your BeAligned password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .RecoveryURL }}">Reset password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
<p>Best regards,<br>The BeAligned Team</p>
```

### 4. Configure Domain Authentication (SPF, DKIM, DMARC)

To ensure emails are delivered and not marked as spam:

1. **SPF Record**: Add to your DNS
   ```
   v=spf1 include:[your-email-provider-spf] ~all
   ```

2. **DKIM**: Your email provider will give you DKIM records to add to DNS

3. **DMARC Record**: Add to your DNS
   ```
   v=DMARC1; p=quarantine; rua=mailto:admin@bealigned.app
   ```

### 5. Update Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: https://bealigned.app
- **Redirect URLs**: 
  - https://bealigned.app/home
  - http://localhost:3000/home (for development)

### 6. Test Configuration

1. Create a test account with a real email address
2. Check that the confirmation email:
   - Arrives from noreply@bealigned.app
   - Has correct branding
   - Links work properly

## Environment Variables

No changes needed in the application code. All email configuration is handled through the Supabase dashboard.

## Troubleshooting

- **Emails not sending**: Check SMTP credentials and firewall settings
- **Emails in spam**: Ensure SPF, DKIM, and DMARC are properly configured
- **Wrong sender**: Verify "Sender email" in SMTP settings
- **Links not working**: Check redirect URLs in Supabase dashboard