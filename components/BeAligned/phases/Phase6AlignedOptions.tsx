import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ReflectionData } from '../../hooks/useReflectionState';
import { phasePrompts } from '../data/prompts';

interface Phase6Props {
  reflection: ReflectionData;
  onComplete: (data: Partial<ReflectionData>) => void;
}

export const Phase6AlignedOptions: React.FC<Phase6Props> = ({ reflection, onComplete }) => {
  const [alignedOptions, setAlignedOptions] = useState<string[]>(reflection.alignedOptions || []);
  const [newOption, setNewOption] = useState('');
  const [selectedOption, setSelectedOption] = useState(reflection.selectedOption || '');
  const [currentStep, setCurrentStep] = useState(1);

  const prompt = phasePrompts[6];

  const addOption = () => {
    if (newOption.trim() && alignedOptions.length < 5) {
      setAlignedOptions(prev => [...prev, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setAlignedOptions(prev => prev.filter((_, i) => i !== index));
    // If the removed option was selected, clear selection
    if (alignedOptions[index] === selectedOption) {
      setSelectedOption('');
    }
  };

  const handleContinue = () => {
    if (currentStep === 1 && alignedOptions.length >= 2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedOption) {
      onComplete({
        alignedOptions,
        selectedOption
      });
    }
  };

  const canContinue = () => {
    if (currentStep === 1) return alignedOptions.length >= 2;
    if (currentStep === 2) return selectedOption.length > 0;
    return false;
  };

  const renderReflectionSummary = () => (
    <View className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <Text className="text-blue-900 font-medium mb-3">Reflection Summary</Text>

      <View className="mb-2">
        <Text className="text-blue-800 text-sm font-medium">Your Why:</Text>
        <Text className="text-blue-700 text-sm">{reflection.yourWhy}</Text>
      </View>

      <View className="mb-2">
        <Text className="text-blue-800 text-sm font-medium">Co-Parent's Possible Why:</Text>
        <Text className="text-blue-700 text-sm">{reflection.coParentWhy}</Text>
      </View>

      <View>
        <Text className="text-blue-800 text-sm font-medium">Child's Needs:</Text>
        <Text className="text-blue-700 text-sm">{reflection.childNeeds.join(', ')}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        {currentStep === 1 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              {prompt.prompt}
            </Text>

            {renderReflectionSummary()}

            <View className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <Text className="text-teal-800 text-sm">
                🎯 Generate 2-5 options that honor all three perspectives: your why, your co-parent's why, and your child's needs.
              </Text>
            </View>

            <Text className="text-blue-800 mb-3 font-medium">
              Brainstorm Aligned Options ({alignedOptions.length}/5):
            </Text>

            <View className="mb-4">
              <TextInput
                value={newOption}
                onChangeText={setNewOption}
                placeholder="Example: Have a calm conversation about creating a consistent pickup routine..."
                multiline
                numberOfLines={3}
                className="bg-white border-2 border-teal-200 rounded-xl p-4 text-base text-gray-800 mb-3"
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                onPress={addOption}
                disabled={!newOption.trim() || alignedOptions.length >= 5}
                className={`py-3 px-4 rounded-lg ${
                  newOption.trim() && alignedOptions.length < 5
                    ? 'bg-teal-500'
                    : 'bg-gray-300'
                }`}
              >
                <Text className={`text-center font-medium ${
                  newOption.trim() && alignedOptions.length < 5
                    ? 'text-white'
                    : 'text-gray-500'
                }`}>
                  Add Option
                </Text>
              </TouchableOpacity>
            </View>

            {alignedOptions.length > 0 && (
              <View className="mb-4">
                <Text className="text-blue-800 font-medium mb-3">Your Options:</Text>
                {alignedOptions.map((option, index) => (
                  <View key={index} className="flex-row items-start mb-3 p-3 bg-white rounded-lg border border-teal-200">
                    <View className="flex-1">
                      <Text className="text-teal-800 font-medium text-sm">Option {index + 1}:</Text>
                      <Text className="text-gray-800 text-sm mt-1">{option}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeOption(index)}
                      className="ml-3 p-1"
                    >
                      <Text className="text-red-500 text-lg">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <Text className="text-amber-800 text-sm">
                💡 {prompt.guidance}
              </Text>
            </View>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Text className="text-lg text-blue-800 mb-4">
              Which option feels most aligned with everyone's needs?
            </Text>

            <Text className="text-blue-700 text-sm mb-4 italic">
              Not just easiest or most familiar, but most aligned with your why, their why, and your child's wellbeing.
            </Text>

            <View className="mb-6">
              {alignedOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedOption(option)}
                  className={`p-4 mb-3 rounded-lg border-2 ${
                    selectedOption === option
                      ? 'bg-teal-100 border-teal-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className={`w-6 h-6 rounded-full border-2 mr-3 mt-0.5 ${
                      selectedOption === option
                        ? 'bg-teal-500 border-teal-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedOption === option && (
                        <View className="w-full h-full flex items-center justify-center">
                          <Text className="text-white text-xs">✓</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-teal-800 font-medium text-sm">Option {index + 1}:</Text>
                      <Text className="text-gray-800 text-sm mt-1">{option}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {selectedOption && (
              <View className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <Text className="text-teal-800 text-sm">
                  ✨ Great choice! This option will guide your CLEAR message in the next step.
                </Text>
              </View>
            )}
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
            {currentStep === 2 ? 'Craft Your Message' : 'Rank Options'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};