#!/bin/bash

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaHJkYWJlaHh6endkbXBtY2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDg5ODEsImV4cCI6MjA3MjgyNDk4MX0.gYUE8FWLr5C3B-5cfSLxeqKefyFK-l_GvsclMRE03MA"

echo "🧪 Testing chat-v2 Edge Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "TEST 1: Vague input (should stay in phase)"
echo "Input: 'My ex keeps changing plans'"
echo ""

curl -s \
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
  }' | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('✅ Response received!')
print(f'📊 Readiness: {data.get(\"readiness\", 0):.2f}')
print(f'🎯 Phase Advanced: {\"✅ YES\" if data.get(\"phase_advanced\") else \"❌ NO\"}')
print(f'📍 Current Phase: {data.get(\"current_phase\")}')
print(f'\n💬 AI Response:')
print('━' * 60)
print(data.get('content', ''))
print('━' * 60)
print(f'\n📝 Summary: {data.get(\"summary\", \"\")}')
if data.get('readiness', 0) < 0.7:
    print('\n✅ CORRECT: Readiness < 0.7, staying in phase')
else:
    print(f'\n⚠️  Readiness >= 0.7, but input was vague')
"

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Detailed input (should advance phase)"
echo "Input: Detailed description with specifics..."
echo ""

curl -s \
  --request POST \
  "https://oohrdabehxzzwdmpmcfv.supabase.co/functions/v1/chat-v2" \
  --header "apikey: $ANON_KEY" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "userInput": "We had agreed that Jason would pick up the kids every Wednesday at 5pm from daycare, but for the third time this month he texted me at 4:30pm saying he cant make it because of work. I had to leave my own meeting early to get them. This keeps happening and its affecting my job performance.",
    "currentPhase": "issue",
    "flowState": {
      "readiness": 0.0,
      "context": {},
      "lastPrompt": "",
      "lastResponse": "",
      "conversationHistory": []
    },
    "sessionId": null
  }' | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('✅ Response received!')
print(f'📊 Readiness: {data.get(\"readiness\", 0):.2f}')
print(f'🎯 Phase Advanced: {\"✅ YES\" if data.get(\"phase_advanced\") else \"❌ NO\"}')
print(f'📍 Original Phase: {data.get(\"original_phase\")}')
print(f'📍 Current Phase: {data.get(\"current_phase\")}')
print(f'\n💬 AI Response:')
print('━' * 60)
print(data.get('content', ''))
print('━' * 60)
print(f'\n📝 Summary: {data.get(\"summary\", \"\")}')
if data.get('readiness', 0) >= 0.7 and data.get('phase_advanced'):
    print('\n🎉 SUCCESS: Readiness >= 0.7 AND phase advanced!')
elif data.get('readiness', 0) >= 0.7:
    print('\n⚠️  Readiness >= 0.7 but phase did not advance')
else:
    print(f'\n⚠️  Readiness {data.get(\"readiness\", 0):.2f} < 0.7 - may need even more detail')
"

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
