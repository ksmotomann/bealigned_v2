import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts } from '../data/prompts';

interface Phase1Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase1IssueNaming: React.FC<Phase1Props> = ({ reflection, onComplete }) => {
  const [issue, setIssue] = useState(reflection.issue || '');
  const [showGuidance, setShowGuidance] = useState(false);

  const prompt = phasePrompts[1];

  const handleContinue = () => {
    if (issue.trim()) {
      onComplete({ issue: issue.trim() });
    }
  };

  return (
    <View className="flex-1">
      <View className="mb-6">
        <Text className="text-lg text-blue-800 mb-4">
          {prompt.prompt}
        </Text>

        <TextInput
          value={issue}
          onChangeText={setIssue}
          placeholder={prompt.placeholder}
          multiline
          numberOfLines={4}
          className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-24"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          onPress={() => setShowGuidance(!showGuidance)}
          className="mt-3"
        >
          <Text className="text-blue-600 text-sm underline">
            {showGuidance ? 'Hide guidance' : 'Show guidance'}
          </Text>
        </TouchableOpacity>

        {showGuidance && (
          <View className="mt-3 p-4 bg-blue-50 rounded-lg">
            <Text className="text-blue-800 text-sm italic">
              {prompt.guidance}
            </Text>
          </View>
        )}
      </View>

      <View className="border-t border-blue-100 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!issue.trim()}
          className={`py-4 px-6 rounded-full ${
            issue.trim()
              ? 'bg-blue-500'
              : 'bg-gray-300'
          }`}
        >
          <Text className={`text-center font-medium ${
            issue.trim()
              ? 'text-white'
              : 'text-gray-500'
          }`}>
            Continue to Feelings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};