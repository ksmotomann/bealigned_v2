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

// Helper to check if API keys are configured
export const hasOpenAIKey = () => !!config.ai.openai.apiKey
export const hasAnthropicKey = () => !!config.ai.anthropic.apiKey