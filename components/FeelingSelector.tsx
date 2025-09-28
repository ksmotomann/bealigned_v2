import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native'
import { feelings, FeelingCategory } from '../lib/feelingsNeeds'

interface FeelingSelectorProps {
  selectedFeelings: string[]
  onSelectionChange: (feelings: string[]) => void
}

export function FeelingSelector({ selectedFeelings, onSelectionChange }: FeelingSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleFeeling = (feeling: string) => {
    const newSelection = selectedFeelings.includes(feeling)
      ? selectedFeelings.filter(f => f !== feeling)
      : [...selectedFeelings, feeling]
    onSelectionChange(newSelection)
  }

  const filterFeelings = (feelingsList: string[]) => {
    if (!searchQuery) return feelingsList
    return feelingsList.filter(feeling =>
      feeling.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search feelings..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {Object.entries(feelings).map(([category, data]) => {
          const feelingData = data as FeelingCategory
          const filteredFeelings = filterFeelings(feelingData.feelings)
          const isExpanded = expandedCategories.has(category) || searchQuery.length > 0
          
          if (filteredFeelings.length === 0 && searchQuery.length > 0) return null
          
          return (
            <View key={category} style={styles.categoryContainer}>
              <Pressable
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
              >
                <Text style={styles.categoryIcon}>{feelingData.emoji}</Text>
                <Text style={styles.categoryTitle}>{feelingData.label}</Text>
                <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
              </Pressable>
              
              {isExpanded && (
                <View style={styles.feelingsGrid}>
                  {filteredFeelings.map(feeling => (
                    <Pressable
                      key={feeling}
                      style={[
                        styles.feelingChip,
                        selectedFeelings.includes(feeling) && styles.feelingChipSelected
                      ]}
                      onPress={() => toggleFeeling(feeling)}
                    >
                      <Text
                        style={[
                          styles.feelingText,
                          selectedFeelings.includes(feeling) && styles.feelingTextSelected
                        ]}
                      >
                        {feeling}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
      
      {selectedFeelings.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Selected ({selectedFeelings.length}):
          </Text>
          <Text style={styles.selectedList}>
            {selectedFeelings.join(', ')}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  expandIcon: {
    fontSize: 20,
    color: '#6B7280',
  },
  feelingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
  },
  feelingChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  feelingChipSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  feelingText: {
    fontSize: 14,
    color: '#4B5563',
  },
  feelingTextSelected: {
    color: '#FFF',
  },
  selectedContainer: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedList: {
    fontSize: 14,
    color: '#1F2937',
  },
})