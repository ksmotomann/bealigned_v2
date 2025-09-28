import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts } from '../data/prompts';
import { NeedsSelector } from '../NeedsSelector';

interface Phase5Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase5ChildPerspective: React.FC<Phase5Props> = ({ reflection, onComplete }) => {
  const [childObservation, setChildObservation] = useState(reflection.childObservation || '');
  const [childFeelings, setChildFeelings] = useState<string[]>(reflection.childFeelings || []);
  const [childNeeds, setChildNeeds] = useState<string[]>(reflection.childNeeds || []);
  const [childHopes, setChildHopes] = useState(reflection.childHopes || '');
  const [currentStep, setCurrentStep] = useState(1);

  const prompt = phasePrompts[5];

  const toggleChildFeeling = (feeling: string) => {
    setChildFeelings(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
  };

  const toggleChildNeed = (need: string) => {
    setChildNeeds(prev =>
      prev.includes(need)
        ? prev.filter(n => n !== need)
        : [...prev, need]
    );
  };

  const handleContinue = () => {
    if (currentStep === 1 && childObservation.trim()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && childFeelings.length > 0) {
      setCurrentStep(3);
    } else if (currentStep === 3 && childNeeds.length > 0) {
      setCurrentStep(4);
    } else if (currentStep === 4 && childHopes.trim()) {
      onComplete({
        childObservation: childObservation.trim(),
        childFeelings,
        childNeeds,
        childHopes: childHopes.trim()
      });
    }
  };

  const canContinue = () => {
    if (currentStep === 1) return childObservation.trim().length > 0;
    if (currentStep === 2) return childFeelings.length > 0;
    if (currentStep === 3) return childNeeds.length > 0;
    if (currentStep === 4) return childHopes.trim().length > 0;
    return false;
  };

  const childEmotions = ['confused', 'sad', 'worried', 'anxious', 'hurt', 'scared', 'frustrated', 'hopeful', 'happy', 'calm', 'excited', 'disappointed', 'angry', 'peaceful', 'secure'];

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        {currentStep === 1 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.prompt}
            </Text>

            <View className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <Text className="text-green-800 text-sm">
                👶 Think about what your child might be seeing, hearing, or sensing about this situation.
              </Text>
            </View>

            <TextInput
              value={childObservation}
              onChangeText={setChildObservation}
              placeholder="Example: They might notice tension between us, or they might see me stressed after our conversations..."
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
                <Text className="font-medium">What they might notice:</Text> {childObservation}
              </Text>
            </View>

            <Text className="text-blue-800 mb-3 font-medium">
              How might your child be feeling about this situation?
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-4">
              {childEmotions.map((emotion) => (
                <TouchableOpacity
                  key={emotion}
                  onPress={() => toggleChildFeeling(emotion)}
                  className={`px-3 py-2 rounded-full ${
                    childFeelings.includes(emotion)
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    childFeelings.includes(emotion) ? 'text-white' : 'text-green-700'
                  }`}>
                    {emotion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {childFeelings.length > 0 && (
              <View className="p-3 bg-green-50 rounded-lg">
                <Text className="text-green-800 text-sm font-medium">
                  Your child might be feeling: {childFeelings.join(', ')}
                </Text>
              </View>
            )}
          </>
        )}

        {currentStep === 3 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              What do they need right now — not from either parent, but just in general?
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Their feelings:</Text> {childFeelings.join(', ')}
              </Text>
            </View>

            <NeedsSelector
              selectedNeeds={childNeeds}
              onNeedToggle={toggleChildNeed}
              title="What Your Child Needs"
              subtitle="What would help them feel secure and supported?"
              maxSelections={4}
            />
          </>
        )}

        {currentStep === 4 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.followUp}
            </Text>

            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-800 text-sm">
                <Text className="font-medium">Their needs:</Text> {childNeeds.join(', ')}
              </Text>
            </View>

            <TextInput
              value={childHopes}
              onChangeText={setChildHopes}
              placeholder="Example: They probably hope we can work things out calmly and that they don't have to worry about us..."
              multiline
              numberOfLines={4}
              className="bg-white border-2 border-blue-200 rounded-xl p-4 text-base text-gray-800 min-h-24"
              placeholderTextColor="#9CA3AF"
            />

            <View className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <Text className="text-green-800 text-sm">
                💚 Your child's wellbeing is the "Third Side" - the shared purpose that can guide both parents toward alignment.
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
            {currentStep === 4 ? 'Explore Aligned Options' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};