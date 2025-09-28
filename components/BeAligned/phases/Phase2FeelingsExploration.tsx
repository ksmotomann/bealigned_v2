import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts } from '../data/prompts';
import { EmotionPicker } from '../EmotionPicker';

interface Phase2Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase2FeelingsExploration: React.FC<Phase2Props> = ({ reflection, onComplete }) => {
  const [surfaceFeelings, setSurfaceFeelings] = useState<string[]>(reflection.surfaceFeelings || []);
  const [deeperFeelings, setDeeperFeelings] = useState<string[]>(reflection.deeperFeelings || []);
  const [feelingsInsight, setFeelingsInsight] = useState(reflection.feelingsInsight || '');
  const [currentStep, setCurrentStep] = useState(1);

  const prompt = phasePrompts[2];

  const toggleSurfaceFeeling = (feeling: string) => {
    setSurfaceFeelings(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
  };

  const toggleDeeperFeeling = (feeling: string) => {
    setDeeperFeelings(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
  };

  const handleContinue = () => {
    if (currentStep === 1 && surfaceFeelings.length > 0) {
      setCurrentStep(2);
    } else if (currentStep === 2 && deeperFeelings.length > 0) {
      setCurrentStep(3);
    } else if (currentStep === 3 && feelingsInsight.trim()) {
      onComplete({
        surfaceFeelings,
        deeperFeelings,
        feelingsInsight: feelingsInsight.trim()
      });
    }
  };

  const canContinue = () => {
    if (currentStep === 1) return surfaceFeelings.length > 0;
    if (currentStep === 2) return deeperFeelings.length > 0;
    if (currentStep === 3) return feelingsInsight.trim().length > 0;
    return false;
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        {currentStep === 1 && (
          <>
            <Text className="text-lg text-blue-800 mb-6">
              {prompt.prompt}
            </Text>

            <EmotionPicker
              selectedEmotions={surfaceFeelings}
              onEmotionToggle={toggleSurfaceFeeling}
              type="surface"
              title="Surface Feelings"
              subtitle="What are you feeling right now about this situation?"
            />

            <View className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Text className="text-amber-800 text-sm">
                💡 These are often the first emotions that come up - like anger, frustration, or stress.
              </Text>
            </View>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.guidance}
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm font-medium">
                Your surface feelings: {surfaceFeelings.join(', ')}
              </Text>
            </View>

            <EmotionPicker
              selectedEmotions={deeperFeelings}
              onEmotionToggle={toggleDeeperFeeling}
              type="core"
              title="Deeper Feelings"
              subtitle="What might be underneath those surface feelings?"
            />

            <View className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Text className="text-purple-800 text-sm">
                💜 Often our surface feelings protect deeper, more vulnerable ones like hurt, fear, or sadness.
              </Text>
            </View>
          </>
        )}

        {currentStep === 3 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.followUp}
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Surface:</Text> {surfaceFeelings.join(', ')}
              </Text>
              <Text className="text-blue-800 text-sm mt-1">
                <Text className="font-medium">Deeper:</Text> {deeperFeelings.join(', ')}
              </Text>
            </View>

            <Text className="text-blue-800 mb-3 font-medium">
              What do these feelings tell you about what matters to you?
            </Text>

            <TextInput
              value={feelingsInsight}
              onChangeText={setFeelingsInsight}
              placeholder="Example: These feelings tell me that I really value consistency and want my child to feel secure..."
              multiline
              numberOfLines={4}
              className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-24"
              placeholderTextColor="#9CA3AF"
            />
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
            {currentStep === 3 ? 'Continue to Your Why' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};