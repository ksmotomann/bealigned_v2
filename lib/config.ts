// Configuration and environment variables
export const config = {
  // Supabase
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  },
  
  // AI Providers
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
  },
}

// Debug log to check if keys are loaded
if (typeof window !== 'undefined') {
  console.log('Config loaded:', {
    hasOpenAIKey: !!config.ai.openai.apiKey,
    hasAnthropicKey: !!config.ai.anthropic.apiKey,
    openAIKeyLength: config.ai.openai.apiKey?.length,
    anthropicKeyLength: config.ai.anthropic.apiKey?.length,
  })
}

// Helper to check if API keys are configured
export const hasOpenAIKey = () => !!config.ai.openai.apiKey
export const hasAnthropicKey = () => !!config.ai.anthropic.apiKey