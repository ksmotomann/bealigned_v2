#!/bin/bash

echo "🧪 Testing chat-v2 edge function with curl..."
echo ""

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Phase 1 - Vague Response"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -i \
  --request POST \
  "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2" \
  --header "apikey: $EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  --header "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "userInput": "My ex keeps changing plans",
    "currentPhase": "issue",
    "flowState": {
      "readiness": 0.0,
      "context": {},
      "lastPrompt": "",
      "lastResponse": "",
      "conversationHistory": []
    },
    "sessionId": null
  }'

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Test complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
