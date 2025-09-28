import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { clearFramework, messageFormulas, goodMessageExamples } from './data/prompts';

interface MessageComposerProps {
  selectedOption: string;
  yourWhy: string;
  childNeeds: string[];
  onMessageDraft: (message: string) => void;
  onAIAssist?: (context: string) => Promise<string>;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  selectedOption,
  yourWhy,
  childNeeds,
  onMessageDraft,
  onAIAssist
}) => {
  const [messageDraft, setMessageDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFramework, setShowFramework] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleAIAssist = async () => {
    if (!onAIAssist) return;

    setIsGenerating(true);
    try {
      const context = `
        Selected approach: ${selectedOption}
        Your why: ${yourWhy}
        Child's needs: ${childNeeds.join(', ')}

        Please help me craft a CLEAR message using this format:
        - Start with "I feel [emotion] when [situation] because [child-centered why]"
        - Or "We both want [shared goal]..."
        - End with "Do you have any ideas how we might...?"

        Keep it concise, listener-ready, essential, appropriate, and relevant.
      `;

      const aiMessage = await onAIAssist(context);
      setMessageDraft(aiMessage);
    } catch (error) {
      console.error('AI assist error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeMessage = () => {
    const analysis = {
      concise: messageDraft.length <= 300,
      hasIFeel: messageDraft.toLowerCase().includes('i feel'),
      hasSharedGoal: messageDraft.toLowerCase().includes('we both want') || messageDraft.toLowerCase().includes('we both'),
      hasInvitation: messageDraft.toLowerCase().includes('do you have any ideas') || messageDraft.toLowerCase().includes('how might we'),
      avoidsBlame: !messageDraft.toLowerCase().includes('you always') && !messageDraft.toLowerCase().includes('you never'),
      childCentered: childNeeds.some(need => messageDraft.toLowerCase().includes(need.toLowerCase())) ||
                    messageDraft.toLowerCase().includes('child') ||
                    messageDraft.toLowerCase().includes('son') ||
                    messageDraft.toLowerCase().includes('daughter')
    };

    return analysis;
  };

  const messageAnalysis = messageDraft ? analyzeMessage() : null;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-medium text-blue-900 mb-4">
          Craft Your CLEAR Message
        </Text>

        <View className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Text className="text-blue-800 text-sm">
            <Text className="font-medium">Your chosen approach:</Text> {selectedOption}
          </Text>
        </View>

        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setShowFramework(!showFramework)}
            className="flex-row items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200"
          >
            <Text className="text-teal-800 font-medium">CLEAR Framework Guide</Text>
            <Text className="text-teal-600">{showFramework ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showFramework && (
            <View className="mt-3 p-4 bg-white rounded-lg border border-teal-200">
              {Object.entries(clearFramework).map(([key, framework]) => (
                <View key={key} className="mb-3">
                  <Text className="text-teal-800 font-medium text-sm">{framework.title}</Text>
                  <Text className="text-teal-700 text-xs mb-1">{framework.description}</Text>
                  {framework.tips.map((tip, index) => (
                    <Text key={index} className="text-gray-600 text-xs ml-2">• {tip}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-blue-800 font-medium mb-2">Message Templates:</Text>
          <View className="space-y-2">
            <TouchableOpacity
              onPress={() => setMessageDraft(messageFormulas.shared)}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <Text className="text-gray-700 text-sm">{messageFormulas.shared}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMessageDraft(messageFormulas.iFeel)}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <Text className="text-gray-700 text-sm">{messageFormulas.iFeel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-blue-800 font-medium mb-2">Your Message:</Text>
          <TextInput
            value={messageDraft}
            onChangeText={setMessageDraft}
            placeholder="Start typing your message here, or use a template above..."
            multiline
            numberOfLines={6}
            className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-32"
            placeholderTextColor="#9CA3AF"
          />

          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-500 text-xs">
              {messageDraft.length} characters
            </Text>
            {onAIAssist && (
              <TouchableOpacity
                onPress={handleAIAssist}
                disabled={isGenerating}
                className="flex-row items-center px-3 py-1 bg-purple-100 rounded-full"
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#7C3AED" />
                ) : (
                  <Text className="text-purple-700 text-xs font-medium">✨ AI Assist</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {messageAnalysis && (
          <View className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <Text className="text-green-800 font-medium mb-3">Message Analysis:</Text>
            <View className="space-y-1">
              <View className="flex-row items-center">
                <Text className={`mr-2 ${messageAnalysis.concise ? 'text-green-600' : 'text-amber-600'}`}>
                  {messageAnalysis.concise ? '✓' : '⚠'}
                </Text>
                <Text className="text-gray-700 text-sm">
                  Concise ({messageDraft.length <= 300 ? 'Good length' : 'Consider shortening'})
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className={`mr-2 ${messageAnalysis.hasIFeel || messageAnalysis.hasSharedGoal ? 'text-green-600' : 'text-amber-600'}`}>
                  {messageAnalysis.hasIFeel || messageAnalysis.hasSharedGoal ? '✓' : '⚠'}
                </Text>
                <Text className="text-gray-700 text-sm">
                  Uses "I feel" or "We both want" format
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className={`mr-2 ${messageAnalysis.avoidsBlame ? 'text-green-600' : 'text-red-600'}`}>
                  {messageAnalysis.avoidsBlame ? '✓' : '✗'}
                </Text>
                <Text className="text-gray-700 text-sm">
                  Avoids blame language
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className={`mr-2 ${messageAnalysis.childCentered ? 'text-green-600' : 'text-amber-600'}`}>
                  {messageAnalysis.childCentered ? '✓' : '⚠'}
                </Text>
                <Text className="text-gray-700 text-sm">
                  Child-centered focus
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className={`mr-2 ${messageAnalysis.hasInvitation ? 'text-green-600' : 'text-amber-600'}`}>
                  {messageAnalysis.hasInvitation ? '✓' : '⚠'}
                </Text>
                <Text className="text-gray-700 text-sm">
                  Includes collaborative invitation
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setShowExamples(!showExamples)}
            className="flex-row items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <Text className="text-blue-800 font-medium">Good Message Examples</Text>
            <Text className="text-blue-600">{showExamples ? '−' : '+'}</Text>
          </TouchableOpacity>

          {showExamples && (
            <View className="mt-3 space-y-3">
              {goodMessageExamples.map((example, index) => (
                <View key={index} className="p-3 bg-white rounded-lg border border-blue-200">
                  <Text className="text-gray-700 text-sm italic">"{example}"</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onMessageDraft(messageDraft)}
          disabled={!messageDraft.trim()}
          className={`py-4 px-6 rounded-full ${
            messageDraft.trim()
              ? 'bg-blue-500'
              : 'bg-gray-300'
          }`}
        >
          <Text className={`text-center font-medium ${
            messageDraft.trim()
              ? 'text-white'
              : 'text-gray-500'
          }`}>
            Complete Reflection
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};