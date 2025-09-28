import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts } from '../data/prompts';
import { EmotionPicker } from '../EmotionPicker';

interface Phase4Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase4CoParentPerspective: React.FC<Phase4Props> = ({ reflection, onComplete }) => {
  const [coParentView, setCoParentView] = useState(reflection.coParentView || '');
  const [coParentFeelings, setCoParentFeelings] = useState<string[]>(reflection.coParentFeelings || []);
  const [coParentWhy, setCoParentWhy] = useState(reflection.coParentWhy || '');
  const [currentStep, setCurrentStep] = useState(1);

  const prompt = phasePrompts[4];

  const toggleCoParentFeeling = (feeling: string) => {
    setCoParentFeelings(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
  };

  const handleContinue = () => {
    if (currentStep === 1 && coParentView.trim()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && coParentFeelings.length > 0) {
      setCurrentStep(3);
    } else if (currentStep === 3 && coParentWhy.trim()) {
      onComplete({
        coParentView: coParentView.trim(),
        coParentFeelings,
        coParentWhy: coParentWhy.trim()
      });
    }
  };

  const canContinue = () => {
    if (currentStep === 1) return coParentView.trim().length > 0;
    if (currentStep === 2) return coParentFeelings.length > 0;
    if (currentStep === 3) return coParentWhy.trim().length > 0;
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

            <View className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Text className="text-amber-800 text-sm">
                💭 This isn't about agreeing with them, but understanding their possible experience to find common ground.
              </Text>
            </View>

            <TextInput
              value={coParentView}
              onChangeText={setCoParentView}
              placeholder="Example: They might see this as me being controlling, or they might feel like I don't trust their parenting..."
              multiline
              numberOfLines={4}
              className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-24"
              placeholderTextColor="#9CA3AF"
            />
          </>
        )}

        {currentStep === 2 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.guidance}
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Their perspective:</Text> {coParentView}
              </Text>
            </View>

            <EmotionPicker
              selectedEmotions={coParentFeelings}
              onEmotionToggle={toggleCoParentFeeling}
              type="surface"
              title="What might they be feeling?"
              subtitle="Even if you don't agree, what emotions might they be experiencing?"
            />
          </>
        )}

        {currentStep === 3 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.followUp}
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Their view:</Text> {coParentView}
              </Text>
              <Text className="text-blue-800 text-sm mt-1">
                <Text className="font-medium">Their feelings:</Text> {coParentFeelings.join(', ')}
              </Text>
            </View>

            <Text className="text-blue-800 mb-3 font-medium">
              What do they care about? What's their "why"?
            </Text>

            <TextInput
              value={coParentWhy}
              onChangeText={setCoParentWhy}
              placeholder="Example: They might want to feel respected as a parent, or they might be trying to protect their relationship with our child..."
              multiline
              numberOfLines={4}
              className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-24"
              placeholderTextColor="#9CA3AF"
            />

            <View className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Text className="text-purple-800 text-sm">
                🤝 Strategic empathy: You don't have to agree, but understanding their perspective creates space for solutions.
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
            {currentStep === 3 ? "Continue to Child's Perspective" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};