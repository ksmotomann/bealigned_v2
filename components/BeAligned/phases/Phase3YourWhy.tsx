import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts } from '../data/prompts';
import { NeedsSelector } from '../NeedsSelector';

interface Phase3Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase3YourWhy: React.FC<Phase3Props> = ({ reflection, onComplete }) => {
  const [yourWhy, setYourWhy] = useState(reflection.yourWhy || '');
  const [deeperValues, setDeeperValues] = useState<string[]>(reflection.deeperValues || []);
  const [currentStep, setCurrentStep] = useState(1);

  const prompt = phasePrompts[3];

  const toggleValue = (value: string) => {
    setDeeperValues(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleContinue = () => {
    if (currentStep === 1 && yourWhy.trim()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && deeperValues.length > 0) {
      onComplete({
        yourWhy: yourWhy.trim(),
        deeperValues
      });
    }
  };

  const canContinue = () => {
    if (currentStep === 1) return yourWhy.trim().length > 0;
    if (currentStep === 2) return deeperValues.length > 0;
    return false;
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        {currentStep === 1 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.prompt}
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Your feelings insight:</Text> {reflection.feelingsInsight}
              </Text>
            </View>

            <TextInput
              value={yourWhy}
              onChangeText={setYourWhy}
              placeholder="Example: I want my child to feel secure and loved by both parents, even when we disagree..."
              multiline
              numberOfLines={4}
              className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-24 mb-4"
              placeholderTextColor="#9CA3AF"
            />

            <View className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Text className="text-amber-800 text-sm font-medium mb-2">
                Guidance:
              </Text>
              <Text className="text-amber-800 text-sm">
                {prompt.guidance}
              </Text>
              <Text className="text-amber-800 text-sm mt-2">
                {prompt.followUp}
              </Text>
            </View>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              What deeper values or needs are most important to you here?
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Your why:</Text> {yourWhy}
              </Text>
            </View>

            <NeedsSelector
              selectedNeeds={deeperValues}
              onNeedToggle={toggleValue}
              title="Your Core Values"
              subtitle="Select the values that feel most connected to your why"
              maxSelections={5}
            />

            <View className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <Text className="text-teal-800 text-sm">
                🌱 These values will guide you toward aligned choices that serve your child's wellbeing.
              </Text>
            </View>
          </>
        )}
      </View>

      <View className="border-t border-blue-100 pt-4 flex-row justify-between">
        {currentStep > 1 && (
          <TouchableOpacity
            onPress={() => setCurrentStep(currentStep - 1)}
            className="py-3 px-6 bg-blue-100 rounded-full"
          >
            <Text className="text-blue-700 font-medium">Back</Text>
          </TouchableOpacity>
        )}

        <View className="flex-1" />

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue()}
          className={`py-4 px-6 rounded-full ${
            canContinue()
              ? 'bg-blue-500'
              : 'bg-gray-300'
          }`}
        >
          <Text className={`text-center font-medium ${
            canContinue()
              ? 'text-white'
              : 'text-gray-500'
          }`}>
            {currentStep === 2 ? 'Continue to Co-Parent Perspective' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};