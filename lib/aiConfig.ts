// AI Configuration constants for admin panel
export type AIModel = 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo'

export const MODEL_INFO = {
  'gpt-4o': { name: 'GPT-4o', description: 'Latest and most capable model' },
  'gpt-4': { name: 'GPT-4', description: 'High-quality, slower responses' },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Fast, cost-effective' }
}

export const DEFAULT_AI_CONFIG = {
  model: 'gpt-4o' as AIModel,
  temperature: 0.7,
  max_tokens: 300
}