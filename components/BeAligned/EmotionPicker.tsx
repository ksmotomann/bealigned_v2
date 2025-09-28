import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { surfaceFeelings, coreFeelings, positiveEmotions, feelingsGlossary } from './data/feelings';

interface EmotionPickerProps {
  selectedEmotions: string[];
  onEmotionToggle: (emotion: string) => void;
  type: 'surface' | 'core' | 'positive';
  title: string;
  subtitle?: string;
}

export const EmotionPicker: React.FC<EmotionPickerProps> = ({
  selectedEmotions,
  onEmotionToggle,
  type,
  title,
  subtitle
}) => {
  const getEmotionsList = () => {
    switch (type) {
      case 'surface':
        return surfaceFeelings;
      case 'core':
        return coreFeelings;
      case 'positive':
        return positiveEmotions;
      default:
        return [];
    }
  };

  const getEmotionStyle = (emotion: string) => {
    const isSelected = selectedEmotions.includes(emotion);

    switch (type) {
      case 'surface':
        return isSelected
          ? 'bg-red-500 text-white'
          : 'bg-red-50 text-red-700 border border-red-200';
      case 'core':
        return isSelected
          ? 'bg-purple-500 text-white'
          : 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'positive':
        return isSelected
          ? 'bg-green-500 text-white'
          : 'bg-green-50 text-green-700 border border-green-200';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const emotions = getEmotionsList();

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

      <View className="flex-row flex-wrap gap-2">
        {emotions.map((emotion) => (
          <TouchableOpacity
            key={emotion}
            onPress={() => onEmotionToggle(emotion)}
            className={`px-3 py-2 rounded-full ${getEmotionStyle(emotion)}`}
          >
            <Text className={`text-sm font-medium ${
              selectedEmotions.includes(emotion) ? 'text-white' : ''
            }`}>
              {emotion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedEmotions.length > 0 && (
        <View className="mt-4 p-3 bg-blue-50 rounded-lg">
          <Text className="text-blue-800 font-medium text-sm mb-2">
            Selected: {selectedEmotions.join(', ')}
          </Text>
          {selectedEmotions.map(emotion => (
            feelingsGlossary[emotion as keyof typeof feelingsGlossary] && (
              <Text key={emotion} className="text-blue-700 text-xs mb-1">
                <Text className="font-medium">{emotion}:</Text> {feelingsGlossary[emotion as keyof typeof feelingsGlossary]}
              </Text>
            )
          ))}
        </View>
      )}
    </View>
  );
};