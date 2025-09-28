import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { deeperNeeds, needsGlossary } from './data/needs';

interface NeedsSelectorProps {
  selectedNeeds: string[];
  onNeedToggle: (need: string) => void;
  title: string;
  subtitle?: string;
  maxSelections?: number;
}

export const NeedsSelector: React.FC<NeedsSelectorProps> = ({
  selectedNeeds,
  onNeedToggle,
  title,
  subtitle,
  maxSelections
}) => {
  const needsByCategory = {
    'Security & Stability': ['safety', 'trust', 'reliability', 'consistency', 'certainty', 'health', 'competence'],
    'Connection & Belonging': ['love', 'care', 'to be heard', 'to be seen', 'belonging', 'inclusion', 'connection', 'understanding', 'empathy', 'attention', 'to be acknowledged'],
    'Growth & Purpose': ['learning', 'contribution', 'competence', 'purpose', 'independence', 'freedom', 'power', 'performance', 'recognition'],
    'Respect & Dignity': ['fairness', 'accountability', 'dignity', 'respect', 'authenticity', 'to matter', 'consideration', 'justice'],
    'Harmony & Peace': ['calm', 'harmony', 'peace', 'acceptance', 'understanding', 'transparency', 'honesty', 'clarity', 'celebration', 'reassurance', 'hope', 'rest', 'fun', 'space', 'privacy']
  };

  const handleNeedToggle = (need: string) => {
    if (maxSelections && selectedNeeds.length >= maxSelections && !selectedNeeds.includes(need)) {
      return; // Don't allow more selections
    }
    onNeedToggle(need);
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-medium text-blue-900 mb-2">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-blue-700 text-sm mb-4 italic">
          {subtitle}
        </Text>
      )}

      {maxSelections && (
        <Text className="text-blue-600 text-sm mb-4">
          Select up to {maxSelections} that resonate most ({selectedNeeds.length}/{maxSelections})
        </Text>
      )}

      {Object.entries(needsByCategory).map(([category, needs]) => (
        <View key={category} className="mb-4">
          <Text className="text-blue-800 font-medium text-sm mb-2">
            {category}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {needs.map((need) => {
              const isSelected = selectedNeeds.includes(need);
              const isDisabled = maxSelections && selectedNeeds.length >= maxSelections && !isSelected;

              return (
                <TouchableOpacity
                  key={need}
                  onPress={() => handleNeedToggle(need)}
                  disabled={isDisabled}
                  className={`px-3 py-2 rounded-full ${
                    isSelected
                      ? 'bg-teal-500 text-white'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    isSelected ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-teal-700'
                  }`}>
                    {need}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {selectedNeeds.length > 0 && (
        <View className="mt-4 p-3 bg-teal-50 rounded-lg">
          <Text className="text-teal-800 font-medium text-sm mb-2">
            Your selected values: {selectedNeeds.join(', ')}
          </Text>
          {selectedNeeds.map(need => (
            needsGlossary[need as keyof typeof needsGlossary] && (
              <Text key={need} className="text-teal-700 text-xs mb-1">
                <Text className="font-medium">{need}:</Text> {needsGlossary[need as keyof typeof needsGlossary]}
              </Text>
            )
          ))}
        </View>
      )}
    </View>
  );
};