import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native'
import { needs, NeedCategory } from '../lib/feelingsNeeds'

interface NeedSelectorProps {
  selectedNeeds: string[]
  onSelectionChange: (needs: string[]) => void
}

export function NeedSelector({ selectedNeeds, onSelectionChange }: NeedSelectorProps) {
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

  const toggleNeed = (need: string) => {
    const newSelection = selectedNeeds.includes(need)
      ? selectedNeeds.filter(n => n !== need)
      : [...selectedNeeds, need]
    onSelectionChange(newSelection)
  }

  const filterNeeds = (needsList: string[]) => {
    if (!searchQuery) return needsList
    return needsList.filter(need =>
      need.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search needs..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {Object.entries(needs).map(([category, data]) => {
          const needData = data as NeedCategory
          const filteredNeeds = filterNeeds(needData.needs)
          const isExpanded = expandedCategories.has(category) || searchQuery.length > 0
          
          if (filteredNeeds.length === 0 && searchQuery.length > 0) return null
          
          return (
            <View key={category} style={styles.categoryContainer}>
              <Pressable
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
              >
                <Text style={styles.categoryIcon}>{needData.emoji}</Text>
                <Text style={styles.categoryTitle}>{needData.label}</Text>
                <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
              </Pressable>
              
              {isExpanded && (
                <View style={styles.needsGrid}>
                  {filteredNeeds.map(need => (
                    <Pressable
                      key={need}
                      style={[
                        styles.needChip,
                        selectedNeeds.includes(need) && styles.needChipSelected
                      ]}
                      onPress={() => toggleNeed(need)}
                    >
                      <Text
                        style={[
                          styles.needText,
                          selectedNeeds.includes(need) && styles.needTextSelected
                        ]}
                      >
                        {need}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
      
      {selectedNeeds.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Selected ({selectedNeeds.length}):
          </Text>
          <Text style={styles.selectedList}>
            {selectedNeeds.join(', ')}
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
  needsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
  },
  needChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  needChipSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  needText: {
    fontSize: 14,
    color: '#4B5563',
  },
  needTextSelected: {
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