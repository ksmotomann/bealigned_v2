import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts, affirmations } from '../data/prompts';
import { MessageComposer } from '../MessageComposer';

interface Phase7Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase7ClearMessage: React.FC<Phase7Props> = ({ reflection, onComplete }) => {
  const [messageDraft, setMessageDraft] = useState(reflection.messageDraft || '');
  const [showSummary, setShowSummary] = useState(false);

  const prompt = phasePrompts[7];
  const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];

  const handleAIAssist = async (context: string): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a BeAligned communication assistant helping co-parents craft CLEAR messages.

CLEAR stands for:
- Concise: Keep it brief and focused
- Listener-Ready: Easy for the co-parent to receive without defensiveness
- Essential: Include only what matters for the child/logistics
- Appropriate: Maintain calm and respectful tone
- Relevant: Tie to shared parenting goals

Use these formulas:
- "I feel [emotion] when [situation] because [child-centered why]. Do you have any ideas how we might...?"
- "We both want [shared goal]... How might we...?"

Focus on the child's wellbeing and invite collaboration. Avoid blame, "you always/never" statements, or bringing up past issues.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Could not generate message. Please try again.';
  };

  const handleMessageDraft = (message: string) => {
    setMessageDraft(message);
  };

  const handleComplete = () => {
    onComplete({
      messageDraft,
      finalMessage: messageDraft,
      completedAt: new Date()
    });
  };

  const renderReflectionSummary = () => (
    <View style={{ padding: 16, backgroundColor: '#EBF8FF', borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' }}>
      <Text style={{ color: '#1E3A8A', fontWeight: '500', marginBottom: 16 }}>Your Reflection Journey</Text>

      <View style={{ gap: 12 }}>
        <View>
          <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>The Issue</Text>
          <Text style={{ color: '#3B82F6', fontSize: 14 }}>{reflection.issue}</Text>
        </View>

        <View>
          <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Feelings</Text>
          <Text style={{ color: '#3B82F6', fontSize: 14 }}>
            Surface: {reflection.surfaceFeelings.join(', ')}
            {reflection.deeperFeelings.length > 0 && (
              <Text> • Deeper: {reflection.deeperFeelings.join(', ')}</Text>
            )}
          </Text>
        </View>

        <View>
          <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Why</Text>
          <Text style={{ color: '#3B82F6', fontSize: 14 }}>{reflection.yourWhy}</Text>
        </View>

        <View>
          <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Co-Parent's Possible Why</Text>
          <Text style={{ color: '#3B82F6', fontSize: 14 }}>{reflection.coParentWhy}</Text>
        </View>

        <View>
          <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Child's Needs</Text>
          <Text style={{ color: '#3B82F6', fontSize: 14 }}>{reflection.childNeeds.join(', ')}</Text>
        </View>

        <View>
          <Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Aligned Choice</Text>
          <Text style={{ color: '#3B82F6', fontSize: 14 }}>{reflection.selectedOption}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 24 }}>
        <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#EBF8FF', borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' }}>
          <Text style={{ color: '#1E40AF', textAlign: 'center', fontStyle: 'italic' }}>
            "{randomAffirmation}"
          </Text>
        </View>

        <Text style={{ fontSize: 18, color: '#1E40AF', marginBottom: 16 }}>
          {prompt.prompt}
        </Text>

        <Text style={{ color: '#3B82F6', marginBottom: 24, fontStyle: 'italic' }}>
          {prompt.description}
        </Text>

        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setShowSummary(!showSummary)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#DBEAFE', borderRadius: 8 }}
          >
            <Text style={{ color: '#1E40AF', fontWeight: '500' }}>Review Your Reflection</Text>
            <Text style={{ color: '#2563EB' }}>{showSummary ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showSummary && (
            <View style={{ marginTop: 12 }}>
              {renderReflectionSummary()}
            </View>
          )}
        </View>

        <MessageComposer
          selectedOption={reflection.selectedOption}
          yourWhy={reflection.yourWhy}
          childNeeds={reflection.childNeeds}
          onMessageDraft={handleMessageDraft}
          onAIAssist={handleAIAssist}
        />

        {messageDraft && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' }}>
            <Text style={{ color: '#166534', fontWeight: '500', marginBottom: 8 }}>Your CLEAR Message:</Text>
            <Text style={{ color: '#374151', fontSize: 14, fontStyle: 'italic', marginBottom: 16 }}>"{messageDraft}"</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#15803D', fontSize: 12 }}>
                  Ready to send this message when you are.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleComplete}
                style={{ backgroundColor: '#22C55E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};