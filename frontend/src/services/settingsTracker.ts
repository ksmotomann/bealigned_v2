// Settings Tracker Service
// Tracks configuration changes and their effectiveness

import { AdminConfig } from '../components/AdminConfigCenter';

export interface SettingsChangeEvent {
  timestamp: string;
  userId: string;
  userType: string;
  changeType: 'preset_applied' | 'manual_change' | 'reset' | 'import';
  section?: keyof AdminConfig;
  previousValue?: any;
  newValue?: any;
  presetName?: string;
}

export interface SettingsEffectiveness {
  configId: string;
  timestamp: string;
  conversationId: string;
  metrics: {
    completionRate: number; // % of users who complete all phases
    avgTimePerPhase: number; // minutes
    userSatisfaction?: number; // 1-5 rating if collected
    dropoffPhase?: string; // where users commonly drop off
    escalationDetected: boolean;
    messagesExchanged: number;
  };
}

class SettingsTracker {
  private changeHistory: SettingsChangeEvent[] = [];
  private effectivenessData: SettingsEffectiveness[] = [];
  private currentConfigHash: string = '';

  // Track a configuration change
  trackChange(event: Omit<SettingsChangeEvent, 'timestamp'>) {
    const changeEvent: SettingsChangeEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    this.changeHistory.push(changeEvent);
    
    // Store in localStorage for persistence
    this.saveToLocalStorage();
    
    // Send to backend analytics
    this.sendToAnalytics('settings_change', changeEvent);
  }

  // Track conversation metrics with current settings
  trackConversationMetrics(conversationId: string, metrics: Partial<SettingsEffectiveness['metrics']>) {
    const effectiveness: SettingsEffectiveness = {
      configId: this.currentConfigHash,
      timestamp: new Date().toISOString(),
      conversationId,
      metrics: {
        completionRate: metrics.completionRate || 0,
        avgTimePerPhase: metrics.avgTimePerPhase || 0,
        userSatisfaction: metrics.userSatisfaction,
        dropoffPhase: metrics.dropoffPhase,
        escalationDetected: metrics.escalationDetected || false,
        messagesExchanged: metrics.messagesExchanged || 0
      }
    };
    
    this.effectivenessData.push(effectiveness);
    this.saveToLocalStorage();
    this.sendToAnalytics('conversation_metrics', effectiveness);
  }

  // Generate a hash of the current configuration for tracking
  generateConfigHash(config: AdminConfig): string {
    // Simple hash based on key settings
    const keySettings = {
      tone: config.responseConfig.tone,
      warmth: config.responseConfig.warmth,
      style: config.responseConfig.responseStyle,
      autoAdvance: config.conversationFlow.autoAdvance,
      temperature: config.aiModel.temperature,
      escalation: config.safety.escalationDetection
    };
    
    return btoa(JSON.stringify(keySettings)).substring(0, 12);
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentData = this.effectivenessData.filter(
      d => new Date(d.timestamp) > last30Days
    );
    
    // Group by config hash
    const configGroups = recentData.reduce((acc, item) => {
      if (!acc[item.configId]) {
        acc[item.configId] = [];
      }
      acc[item.configId].push(item);
      return acc;
    }, {} as Record<string, SettingsEffectiveness[]>);
    
    // Calculate averages for each config
    const configPerformance = Object.entries(configGroups).map(([configId, data]) => {
      const avgCompletion = data.reduce((sum, d) => sum + d.metrics.completionRate, 0) / data.length;
      const avgTime = data.reduce((sum, d) => sum + d.metrics.avgTimePerPhase, 0) / data.length;
      const avgSatisfaction = data
        .filter(d => d.metrics.userSatisfaction !== undefined)
        .reduce((sum, d) => sum + (d.metrics.userSatisfaction || 0), 0) / 
        data.filter(d => d.metrics.userSatisfaction !== undefined).length || 0;
      
      const escalationRate = data.filter(d => d.metrics.escalationDetected).length / data.length;
      
      // Find most common dropoff phase
      const dropoffCounts = data
        .filter(d => d.metrics.dropoffPhase)
        .reduce((acc, d) => {
          const phase = d.metrics.dropoffPhase!;
          acc[phase] = (acc[phase] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      const mostCommonDropoff = Object.entries(dropoffCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      return {
        configId,
        conversationCount: data.length,
        avgCompletionRate: avgCompletion,
        avgTimePerPhase: avgTime,
        avgSatisfaction,
        escalationRate,
        mostCommonDropoff,
        lastUsed: data[data.length - 1].timestamp
      };
    });
    
    // Sort by performance (completion rate + satisfaction)
    configPerformance.sort((a, b) => {
      const scoreA = a.avgCompletionRate + (a.avgSatisfaction / 5);
      const scoreB = b.avgCompletionRate + (b.avgSatisfaction / 5);
      return scoreB - scoreA;
    });
    
    return {
      topPerformingConfigs: configPerformance.slice(0, 3),
      recentChanges: this.changeHistory.slice(-10).reverse(),
      totalConversations: recentData.length,
      overallCompletionRate: recentData.reduce((sum, d) => sum + d.metrics.completionRate, 0) / recentData.length || 0
    };
  }

  // Get recommendations based on data
  getRecommendations(): string[] {
    const summary = this.getAnalyticsSummary();
    const recommendations: string[] = [];
    
    if (summary.overallCompletionRate < 0.5) {
      recommendations.push("Consider using 'smart' auto-advance mode to help users progress through phases");
    }
    
    if (summary.topPerformingConfigs[0]?.escalationRate > 0.3) {
      recommendations.push("High escalation rate detected. Consider increasing safety sensitivity");
    }
    
    if (summary.topPerformingConfigs[0]?.avgTimePerPhase > 15) {
      recommendations.push("Users spending long time per phase. Consider more concise response style");
    }
    
    if (summary.topPerformingConfigs[0]?.mostCommonDropoff === 'coparent') {
      recommendations.push("Many users drop off at 'Co-parent Perspective' phase. Consider adjusting tone to be more supportive");
    }
    
    return recommendations;
  }

  // Save to localStorage
  private saveToLocalStorage() {
    localStorage.setItem('bealigned_settings_history', JSON.stringify(this.changeHistory.slice(-100)));
    localStorage.setItem('bealigned_effectiveness_data', JSON.stringify(this.effectivenessData.slice(-500)));
    localStorage.setItem('bealigned_current_config_hash', this.currentConfigHash);
  }

  // Load from localStorage
  loadFromLocalStorage() {
    const history = localStorage.getItem('bealigned_settings_history');
    const effectiveness = localStorage.getItem('bealigned_effectiveness_data');
    const configHash = localStorage.getItem('bealigned_current_config_hash');
    
    if (history) this.changeHistory = JSON.parse(history);
    if (effectiveness) this.effectivenessData = JSON.parse(effectiveness);
    if (configHash) this.currentConfigHash = configHash;
  }

  // Send to backend analytics
  private async sendToAnalytics(eventType: string, data: any) {
    try {
      // This would send to your backend analytics endpoint
      // For now, just log to console
      console.log(`[Analytics] ${eventType}:`, data);
      
      // In production:
      // await api.post('/api/analytics/settings', { eventType, data });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  // Update current config hash
  setCurrentConfig(config: AdminConfig) {
    this.currentConfigHash = this.generateConfigHash(config);
  }
}

// Export singleton instance
export const settingsTracker = new SettingsTracker();

// Initialize on load
if (typeof window !== 'undefined') {
  settingsTracker.loadFromLocalStorage();
}