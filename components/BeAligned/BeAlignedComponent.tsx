import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useReflectionState } from './hooks/useReflectionState';
import { ReflectionPhase } from './ReflectionPhase';

export interface BeAlignedProps {
  onComplete?: (reflection: ReflectionData) => void;
  onPhaseChange?: (phase: number) => void;
  className?: string;
}

export interface ReflectionData {
  issue: string;
  feelings: string[];
  deeperFeelings: string[];
  yourWhy: string;
  coParentView: string;
  childPerspective: string;
  alignedOptions: string[];
  selectedOption: string;
  messageDraft: string;
}

const PHASE_TITLES = [
  "What's the Issue?",
  "Explore Your Feelings",
  "Dig Deeper",
  "Connect to Your Why",
  "Consider Your Co-Parent",
  "Child-Centered Lens",
  "Create Aligned Options",
  "Craft Your CLEAR Message"
];

const PHASE_DESCRIPTIONS = [
  "Take a breath. You're doing meaningful work.",
  "What are you feeling right now about this situation?",
  "Let's explore what's beneath those surface feelings.",
  "What matters most to you in this situation?",
  "How might your co-parent be experiencing this?",
  "What would be best for your child(ren)?",
  "What are 2-3 aligned ways to move forward?",
  "You don't have to get it perfect. Just aligned."
];

export const BeAlignedComponent: React.FC<BeAlignedProps> = ({
  onComplete,
  onPhaseChange,
  className = '',
}) => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const { reflection, updateReflection, resetReflection } = useReflectionState();

  const handlePhaseComplete = (phaseData: Partial<ReflectionData>) => {
    updateReflection(phaseData);

    if (currentPhase < 7) {
      const nextPhase = currentPhase + 1;
      setCurrentPhase(nextPhase);
      onPhaseChange?.(nextPhase);
    } else {
      onComplete?.(reflection);
    }
  };

  const handlePreviousPhase = () => {
    if (currentPhase > 1) {
      const prevPhase = currentPhase - 1;
      setCurrentPhase(prevPhase);
      onPhaseChange?.(prevPhase);
    }
  };

  const handleReset = () => {
    resetReflection();
    setCurrentPhase(1);
    onPhaseChange?.(1);
  };

  return (
    <View className={`flex-1 bg-gradient-to-b from-blue-50 to-white ${className}`}>
      {/* Header */}
      <View className="px-6 py-4 bg-white shadow-sm">
        <Text className="text-2xl font-light text-blue-900 text-center">
          BeAligned Reflection
        </Text>
        <Text className="text-sm text-blue-600 text-center mt-1">
          Phase {currentPhase} of 7
        </Text>

        {/* Progress Bar */}
        <View className="mt-4 bg-blue-100 rounded-full h-2">
          <View
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentPhase / 7) * 100}%` }}
          />
        </View>
      </View>

      {/* Phase Content */}
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          <Text className="text-xl font-medium text-blue-900 mb-2">
            {PHASE_TITLES[currentPhase - 1]}
          </Text>
          <Text className="text-blue-700 mb-6 italic">
            {PHASE_DESCRIPTIONS[currentPhase - 1]}
          </Text>

          <ReflectionPhase
            phase={currentPhase}
            reflection={reflection}
            onComplete={handlePhaseComplete}
          />
        </View>
      </ScrollView>

      {/* Navigation */}
      <View className="px-6 py-4 bg-white border-t border-blue-100">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handlePreviousPhase}
            disabled={currentPhase === 1}
            className={`py-3 px-6 rounded-full ${
              currentPhase === 1
                ? 'bg-gray-100'
                : 'bg-blue-100'
            }`}
          >
            <Text className={`font-medium ${
              currentPhase === 1
                ? 'text-gray-400'
                : 'text-blue-700'
            }`}>
              Previous
            </Text>
          </TouchableOpacity>

          {currentPhase === 7 && (
            <TouchableOpacity
              onPress={handleReset}
              className="py-3 px-6 bg-blue-50 rounded-full"
            >
              <Text className="text-blue-600 font-medium">New Reflection</Text>
            </TouchableOpacity>
          )}

          <View className="flex-1" />
        </View>
      </View>
    </View>
  );
};

export default BeAlignedComponent;