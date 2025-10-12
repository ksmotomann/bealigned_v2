#!/bin/bash

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHJkYWJlaHh6endkbXBtY2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDg5ODEsImV4cCI6MjA3MjgyNDk4MX0.gYUE8FWLr5C3B-5cfSLxeqKefyFK-l_GvsclMRE03MA"

echo "🧪 Testing chat-v2 Multi-Turn Conversation Flow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Simulating a realistic conversation to test phase advancement..."
echo ""

# Message 1: Initial vague input
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MESSAGE 1: Initial vague input"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE1=$(curl -s \
  --request POST \
  "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2" \
  --header "apikey: $ANON_KEY" \
  --header "Authorization: Bearer $ANON_KEY" \
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
  }')

echo "$RESPONSE1" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'📊 Readiness: {data.get(\"readiness\", 0):.2f}')
print(f'🎯 Phase: {data.get(\"current_phase\")}')
print(f'💬 AI: {data.get(\"content\", \"\")[:200]}...')
" || echo "❌ Parse error"

# Extract flow_state for next message
FLOW_STATE_1=$(echo "$RESPONSE1" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin)['flow_state']))")

echo ""
echo ""

# Message 2: More detailed response
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MESSAGE 2: Adding more detail"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE2=$(curl -s \
  --request POST \
  "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2" \
  --header "apikey: $ANON_KEY" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"userInput\": \"Jason was supposed to pick up the kids from daycare at 5pm on Wednesday, but he texted at 4:30 saying he can't make it. This is the third time this month.\",
    \"currentPhase\": \"issue\",
    \"flowState\": $FLOW_STATE_1,
    \"sessionId\": null
  }")

echo "$RESPONSE2" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'📊 Readiness: {data.get(\"readiness\", 0):.2f}')
print(f'🎯 Phase: {data.get(\"current_phase\")}')
print(f'💬 AI: {data.get(\"content\", \"\")[:200]}...')
" || echo "❌ Parse error"

FLOW_STATE_2=$(echo "$RESPONSE2" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin)['flow_state']))")

echo ""
echo ""

# Message 3: Adding impact and specifics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MESSAGE 3: Impact and deeper detail"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE3=$(curl -s \
  --request POST \
  "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2" \
  --header "apikey: $ANON_KEY" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"userInput\": \"I had to leave my own work meeting early to pick them up. My boss noticed and made a comment. I'm worried this is affecting how I'm perceived at work. And the kids were confused and upset because they were expecting their dad.\",
    \"currentPhase\": \"issue\",
    \"flowState\": $FLOW_STATE_2,
    \"sessionId\": null
  }")

echo "$RESPONSE3" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'📊 Readiness: {data.get(\"readiness\", 0):.2f}')
print(f'🎯 Phase Advanced: {\"✅ YES\" if data.get(\"phase_advanced\") else \"❌ NO\"}')
print(f'📍 Original Phase: {data.get(\"original_phase\")}')
print(f'📍 Current Phase: {data.get(\"current_phase\")}')
print(f'\n💬 Full AI Response:')
print('━' * 70)
print(data.get('content', ''))
print('━' * 70)
print(f'\n📝 Summary: {data.get(\"summary\", \"\")}')
print(f'\n🔍 Context Captured:')
import json
context = data.get('flow_state', {}).get('context', {})
for key, value in context.items():
    print(f'   {key}: {str(value)[:100]}...')
" || echo "❌ Parse error"

FLOW_STATE_3=$(echo "$RESPONSE3" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin)['flow_state']))")

echo ""
echo ""

# Message 4: Confirming understanding (if still in phase 1)
CURRENT_PHASE=$(echo "$RESPONSE3" | python3 -c "import json, sys; print(json.load(sys.stdin).get('current_phase', 'issue'))")

if [ "$CURRENT_PHASE" = "issue" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "MESSAGE 4: Confirming full picture"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  RESPONSE4=$(curl -s \
    --request POST \
    "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2" \
    --header "apikey: $ANON_KEY" \
    --header "Authorization: Bearer $ANON_KEY" \
    --header "Content-Type: application/json" \
    --data "{
      \"userInput\": \"Yes, that's the whole situation. We had a clear agreement and he's not following through. It's creating chaos for everyone - me, my job, and most importantly the kids.\",
      \"currentPhase\": \"issue\",
      \"flowState\": $FLOW_STATE_3,
      \"sessionId\": null
    }")

  echo "$RESPONSE4" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'📊 Readiness: {data.get(\"readiness\", 0):.2f}')
print(f'🎯 Phase Advanced: {\"✅ YES\" if data.get(\"phase_advanced\") else \"❌ NO\"}')
print(f'📍 Original Phase: {data.get(\"original_phase\")}')
print(f'📍 Current Phase: {data.get(\"current_phase\")}')
print(f'\n💬 Full AI Response:')
print('━' * 70)
print(data.get('content', ''))
print('━' * 70)
print(f'\n📝 Summary: {data.get(\"summary\", \"\")}')

if data.get('phase_advanced'):
    print('\n🎉 SUCCESS! Phase advanced after natural conversation flow')
    print(f'   {data.get(\"original_phase\")} → {data.get(\"current_phase\")}')
elif data.get('readiness', 0) >= 0.7:
    print(f'\n⚠️  Readiness {data.get(\"readiness\"):.2f} >= 0.7 but did not advance')
else:
    print(f'\n⏳ Readiness {data.get(\"readiness\"):.2f} < 0.7, conversation continuing...')
" || echo "❌ Parse error"
else
  echo "✅ Phase already advanced to: $CURRENT_PHASE"
fi

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Conversation Flow Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
