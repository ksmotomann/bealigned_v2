import React from 'react';
import { Modal, View, TouchableOpacity, Text, SafeAreaView, Alert } from 'react-native';
import { BeAlignedComponent, ReflectionData } from './BeAlignedComponent';

interface BeAlignedModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (reflection: ReflectionData) => void;
}

export const BeAlignedModal: React.FC<BeAlignedModalProps> = ({
  visible,
  onClose,
  onComplete
}) => {
  const handleComplete = (reflection: ReflectionData) => {
    console.log('BeAligned reflection completed:', reflection.finalMessage);

    // Show completion alert
    Alert.alert(
      'Reflection Complete! 🎉',
      'Your CLEAR message is ready. You can now copy and send it to your co-parent.',
      [
        {
          text: 'View Message',
          onPress: () => {
            Alert.alert(
              'Your CLEAR Message',
              reflection.finalMessage,
              [{ text: 'Done', onPress: () => onClose() }]
            );
          }
        },
        { text: 'Close', onPress: () => onClose() }
      ]
    );

    // TODO: Save to Supabase
    // You can add your Supabase integration here:
    // await saveReflectionToSupabase(reflection);

    onComplete?.(reflection);
  };

  const handlePhaseChange = (phase: number) => {
    console.log('BeAligned Phase:', phase);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-blue-50">
        <View className="flex-row justify-between items-center p-4 bg-white shadow-sm">
          <View>
            <Text className="text-lg font-medium text-blue-900">BeAligned Reflection</Text>
            <Text className="text-xs text-blue-600">Guided co-parenting support</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-blue-600 text-lg font-bold">✕</Text>
          </TouchableOpacity>
        </View>

        <BeAlignedComponent
          onComplete={handleComplete}
          onPhaseChange={handlePhaseChange}
          className="flex-1"
        />
      </SafeAreaView>
    </Modal>
  );
};