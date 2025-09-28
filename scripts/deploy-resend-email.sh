#!/bin/bash

# Script to deploy Resend email configuration to Supabase

echo "BeAligned - Resend Email Configuration"
echo "======================================"
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Setting SUPABASE_ACCESS_TOKEN..."
  export SUPABASE_ACCESS_TOKEN='sbp_c9eac0384c0e7b08c08f0fa3f8269daa9bcb6d0d'
fi

# Get Resend API key from user
read -p "Enter your Resend API key (starts with 're_'): " RESEND_API_KEY

if [ -z "$RESEND_API_KEY" ]; then
  echo "Error: Resend API key is required"
  exit 1
fi

# Validate that the key starts with 're_' or 'resend_'
if [[ ! "$RESEND_API_KEY" =~ ^(re_|resend_) ]]; then
  echo "Error: Invalid Resend API key format. It should start with 're_' or 'resend_'"
  exit 1
fi

echo ""
echo "Deploying Edge Functions with Resend integration..."

# Deploy send-transcript function
echo "1. Deploying send-transcript function..."
cd /Users/robertmann/Projects/bealigned-lite/supabase/functions
supabase functions deploy send-transcript --project-ref qujysevuyhqyitxqctxg

# Set the Resend API key as a secret
echo ""
echo "2. Setting Resend API key as secret..."
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY" --project-ref qujysevuyhqyitxqctxg

# Deploy send-email function if it exists
if [ -d "send-email" ]; then
  echo ""
  echo "3. Deploying send-email function..."
  supabase functions deploy send-email --project-ref qujysevuyhqyitxqctxg
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify your domain in Resend Dashboard: https://resend.com/domains"
echo "2. Add these DNS records to your domain (bealigned.app):"
echo "   - SPF: TXT record with Resend's SPF"
echo "   - DKIM: CNAME records provided by Resend"
echo "3. Test the email sending from your application"
echo ""
echo "Your emails will be sent from: noreply@bealigned.app"
echo "Reply-to address: support@bealigned.app"