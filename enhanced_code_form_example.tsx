// Enhanced Alignment Code Creation Form
// This shows how to add expiration and subscription path controls

import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, Switch } from 'react-native'

interface AlignmentCodeForm {
  code: string
  description: string
  expires_at: string
  max_uses: number | null
  subscription_tier: string
  trial_days: number
  conversion_price: number
  regular_price: number
  bonus_conditions: {
    bonus_days?: number
    min_uses_required?: number
    description?: string
  }
  auto_expire_behavior: 'require_payment' | 'show_conversion_offer' | 'extend_trial'
}

export default function EnhancedCodeForm() {
  const [formData, setFormData] = useState<AlignmentCodeForm>({
    code: '',
    description: '',
    expires_at: '',
    max_uses: null,
    subscription_tier: 'pilot_partner',
    trial_days: 45,
    conversion_price: 49.95,
    regular_price: 79.95,
    bonus_conditions: {},
    auto_expire_behavior: 'show_conversion_offer'
  })

  const [hasUsageBonus, setHasUsageBonus] = useState(false)

  const subscriptionTiers = [
    { id: 'pilot_partner', name: 'Pilot Partner', trial: 45, conversion: 49.95, regular: 79.95 },
    { id: 'premium', name: 'Premium', trial: 30, conversion: 59.95, regular: 79.95 },
    { id: 'basic', name: 'Basic', trial: 14, conversion: 39.95, regular: 59.95 },
    { id: 'free', name: 'Free Trial', trial: 7, conversion: 0, regular: 0 }
  ]

  const expireBehaviors = [
    { id: 'require_payment', name: 'Require Payment' },
    { id: 'show_conversion_offer', name: 'Show Conversion Offer' },
    { id: 'extend_trial', name: 'Auto-Extend Trial' }
  ]

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Create Alignment Code
      </Text>

      {/* Basic Code Info */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Code Name</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
          value={formData.code}
          onChangeText={(text) => setFormData(prev => ({ ...prev, code: text.toUpperCase() }))}
          placeholder="e.g., PILOT-01"
          autoCapitalize="characters"
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Description</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Describe this code's purpose"
          multiline
        />
      </View>

      {/* Expiration Settings */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          📅 Expiration Settings
        </Text>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Code Expires On</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
            value={formData.expires_at}
            onChangeText={(text) => setFormData(prev => ({ ...prev, expires_at: text }))}
            placeholder="YYYY-MM-DD or leave empty for no expiration"
          />
          <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            When the code itself stops working (optional)
          </Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Max Uses</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
            value={formData.max_uses?.toString() || ''}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              max_uses: text ? parseInt(text) : null
            }))}
            placeholder="Leave empty for unlimited"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Subscription Path */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          💳 Subscription Path
        </Text>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Subscription Tier</Text>
          {subscriptionTiers.map(tier => (
            <Pressable
              key={tier.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderWidth: 1,
                borderColor: formData.subscription_tier === tier.id ? '#007AFF' : '#ccc',
                borderRadius: 8,
                marginBottom: 8,
                backgroundColor: formData.subscription_tier === tier.id ? '#007AFF10' : 'white'
              }}
              onPress={() => setFormData(prev => ({
                ...prev,
                subscription_tier: tier.id,
                trial_days: tier.trial,
                conversion_price: tier.conversion,
                regular_price: tier.regular
              }))}
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.subscription_tier === tier.id ? '#007AFF' : '#ccc',
                backgroundColor: formData.subscription_tier === tier.id ? '#007AFF' : 'white',
                marginRight: 12
              }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>{tier.name}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {tier.trial} days trial → ${tier.conversion}/year → ${tier.regular}/year
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Trial Days</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
              value={formData.trial_days.toString()}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                trial_days: parseInt(text) || 0
              }))}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Conversion Price</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
              value={formData.conversion_price.toString()}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                conversion_price: parseFloat(text) || 0
              }))}
              keyboardType="numeric"
              placeholder="49.95"
            />
          </View>
        </View>
      </View>

      {/* Bonus Conditions */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          🎁 Bonus Conditions
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Switch
            value={hasUsageBonus}
            onValueChange={(value) => {
              setHasUsageBonus(value)
              if (!value) {
                setFormData(prev => ({ ...prev, bonus_conditions: {} }))
              }
            }}
          />
          <Text style={{ marginLeft: 8, fontWeight: '600' }}>
            Grant bonus days for active usage
          </Text>
        </View>

        {hasUsageBonus && (
          <View style={{ backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>Bonus Days</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 }}
                  value={formData.bonus_conditions.bonus_days?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    bonus_conditions: {
                      ...prev.bonus_conditions,
                      bonus_days: parseInt(text) || 0
                    }
                  }))}
                  keyboardType="numeric"
                  placeholder="45"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>Min Uses Required</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 }}
                  value={formData.bonus_conditions.min_uses_required?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    bonus_conditions: {
                      ...prev.bonus_conditions,
                      min_uses_required: parseInt(text) || 0
                    }
                  }))}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>
            </View>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Example: Grant 45 bonus days if user uses the app 5+ times
            </Text>
          </View>
        )}
      </View>

      {/* Expiration Behavior */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          ⚙️ When Trial Expires
        </Text>

        {expireBehaviors.map(behavior => (
          <Pressable
            key={behavior.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderWidth: 1,
              borderColor: formData.auto_expire_behavior === behavior.id ? '#007AFF' : '#ccc',
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: formData.auto_expire_behavior === behavior.id ? '#007AFF10' : 'white'
            }}
            onPress={() => setFormData(prev => ({
              ...prev,
              auto_expire_behavior: behavior.id as any
            }))}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: formData.auto_expire_behavior === behavior.id ? '#007AFF' : '#ccc',
              backgroundColor: formData.auto_expire_behavior === behavior.id ? '#007AFF' : 'white',
              marginRight: 12
            }} />
            <Text style={{ fontWeight: '600' }}>{behavior.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Create Button */}
      <Pressable
        style={{
          backgroundColor: '#007AFF',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center'
        }}
        onPress={() => {
          console.log('Creating code with data:', formData)
          // Here you would call your Supabase insert function
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          Create Alignment Code
        </Text>
      </Pressable>
    </View>
  )
}