import { supabase } from './supabase'

export type FeedbackSource = 
  | 'user_feedback'      // Direct user feedback during chat
  | 'bealigned_gpt'      // Feedback from BeAligned GPT gold standard
  | 'admin_review'       // Admin manual review
  | 'automated_test'     // Automated testing feedback
  | 'session_analysis'   // Post-session analysis

export interface TrainingFeedback {
  message_id: string
  session_id: string
  phase_number: number
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'alternative_response' | 'missing_prompt' | 'correction'
  original_content: string
  suggested_content?: string
  feedback_notes?: string
  user_input?: string
  conversation_context?: any
  admin_id: string
  weight?: number
  priority?: 'low' | 'normal' | 'high' | 'critical'
  feedback_source?: FeedbackSource
}

class TrainingService {
  private feedbackQueue: TrainingFeedback[] = []
  private isProcessing = false

  // Queue feedback for background processing
  async queueFeedback(feedback: Omit<TrainingFeedback, 'admin_id'>): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    // Only admins can provide training feedback
    if (profile?.role !== 'admin') return

    const fullFeedback: TrainingFeedback = {
      ...feedback,
      admin_id: userData.user.id,
      // Default to user_feedback if not specified
      feedback_source: feedback.feedback_source || 'user_feedback'
    }

    // Add to queue for background processing
    this.feedbackQueue.push(fullFeedback)
    
    // Process queue in background without blocking
    if (!this.isProcessing) {
      this.processQueueInBackground()
    }
  }

  // Background process to save feedback
  private async processQueueInBackground(): Promise<void> {
    this.isProcessing = true
    
    while (this.feedbackQueue.length > 0) {
      const feedback = this.feedbackQueue.shift()
      if (feedback) {
        try {
          await supabase.from('training_feedback').insert(feedback)
        } catch (error) {
          console.error('Failed to save training feedback:', error)
        }
      }
    }
    
    this.isProcessing = false
  }

  // Auto-tune function for admin settings
  async autoTune(): Promise<{
    success: boolean
    patternsLearned: number
    feedbackProcessed: number
  }> {
    try {
      // Call the database function to learn from feedback
      const { data, error } = await supabase.rpc('learn_from_feedback')
      
      if (error) throw error

      // Get metrics
      const { data: metrics } = await supabase
        .from('training_feedback')
        .select('id', { count: 'exact' })
        .eq('applied_to_model', false)

      const { data: patterns } = await supabase
        .from('training_patterns')
        .select('id', { count: 'exact' })
        .eq('is_active', true)

      return {
        success: true,
        patternsLearned: patterns?.length || 0,
        feedbackProcessed: metrics?.length || 0
      }
    } catch (error) {
      console.error('Auto-tune failed:', error)
      return {
        success: false,
        patternsLearned: 0,
        feedbackProcessed: 0
      }
    }
  }

  // Get current user
  async getCurrentUser() {
    return await supabase.auth.getUser()
  }

  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    return profile?.role === 'admin'
  }

  // Get feedback history for a specific message
  async getFeedbackHistory(
    messageId: string,
    phaseNumber?: number
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('training_feedback')
        .select('*')
        .or(`message_id.eq.${messageId},original_content.eq.${messageId}`)
        .order('created_at', { ascending: false })

      if (phaseNumber !== undefined) {
        query = query.eq('phase_number', phaseNumber)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get feedback history:', error)
      return []
    }
  }

  // Get training metrics for dashboard
  async getTrainingMetrics(): Promise<{
    totalFeedback: number
    positiveFeedback: number
    negativeFeedback: number
    patternsLearned: number
    avgConfidence: number
  }> {
    const { data } = await supabase
      .from('training_dashboard')
      .select('*')

    const totals = data?.reduce((acc, phase) => ({
      totalFeedback: acc.totalFeedback + (phase.feedback_count || 0),
      positiveFeedback: acc.positiveFeedback + (phase.positive_count || 0),
      negativeFeedback: acc.negativeFeedback + (phase.negative_count || 0),
      patternsLearned: acc.patternsLearned + (phase.pattern_count || 0),
      avgConfidence: [...acc.confidences, phase.avg_pattern_confidence].filter(Boolean)
    }), {
      totalFeedback: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      patternsLearned: 0,
      confidences: []
    })

    return {
      totalFeedback: totals?.totalFeedback || 0,
      positiveFeedback: totals?.positiveFeedback || 0,
      negativeFeedback: totals?.negativeFeedback || 0,
      patternsLearned: totals?.patternsLearned || 0,
      avgConfidence: totals?.confidences.length > 0 
        ? totals.confidences.reduce((a, b) => a + b, 0) / totals.confidences.length 
        : 0
    }
  }

  // Apply learned patterns to a response (called during AI generation)
  async applyLearnedPatterns(
    userInput: string,
    phaseNumber: number,
    originalResponse: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('apply_training_feedback', {
        p_user_input: userInput,
        p_phase_number: phaseNumber,
        p_original_response: originalResponse
      })

      if (error) throw error
      return data || originalResponse
    } catch (error) {
      console.error('Failed to apply learned patterns:', error)
      return originalResponse
    }
  }
}

export const trainingService = new TrainingService()