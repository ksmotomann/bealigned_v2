import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import WaveCircle from './WaveCircle'

const WaveCircleDemo = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>WaveCircle Component Demo</Text>

      {/* Basic Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Example</Text>
        <WaveCircle
          size={100}
          color="#FFFFFF"
          waveColor="rgba(0, 122, 255, 0.3)"
          waveCount={3}
          duration={3000}
        >
          <Text style={styles.centerText}>BE</Text>
        </WaveCircle>
      </View>

      {/* Primary Brand Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Brand Colors</Text>
        <WaveCircle
          size={80}
          color="#5BADCF"
          waveColor="rgba(91, 173, 207, 0.4)"
          waveCount={3}
          duration={2500}
        >
          <Text style={[styles.centerText, { color: 'white', fontSize: 16 }]}>
            ◉
          </Text>
        </WaveCircle>
      </View>

      {/* Custom Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fast & Many Waves</Text>
        <WaveCircle
          size={60}
          color="#FF6B6B"
          waveColor="rgba(255, 107, 107, 0.2)"
          waveCount={5}
          duration={1500}
        >
          <Text style={[styles.centerText, { fontSize: 14, color: 'white' }]}>
            ⚡
          </Text>
        </WaveCircle>
      </View>

      {/* Slow & Minimal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Slow & Minimal</Text>
        <WaveCircle
          size={120}
          color="#4ECDC4"
          waveColor="rgba(78, 205, 196, 0.25)"
          waveCount={2}
          duration={4000}
        >
          <Text style={[styles.centerText, { fontSize: 18, color: 'white' }]}>
            🌊
          </Text>
        </WaveCircle>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#666',
  },
  centerText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
})

export default WaveCircleDemo