import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  XMarkIcon,
  SparklesIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  BeakerIcon,
  CommandLineIcon,
  CpuChipIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/CustomAuthContext';
import { assistantSettingsApi } from '../services/assistantSettingsApi';
import { settingsTracker } from '../services/settingsTracker';

// Comprehensive configuration structure
export interface AdminConfig {
  // System Instructions
  systemInstructions: {
    mainPrompt: string;
    reflectionPhases: {
      name_it: string;
      beneath: string;
      why: string;
      coparent: string;
      child: string;
      options: string;
      choose: string;
    };
    responseGuidelines: string;
    safetyGuidelines: string;
    disclaimers: string;
  };
  
  // AI Model Configuration
  aiModel: {
    provider: 'openai' | 'anthropic' | 'custom';
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences: string[];
  };
  
  // Conversation Flow
  conversationFlow: {
    autoAdvance: 'manual' | 'smart' | 'always';
    maxFollowupsPerPhase: number;
    skipIfConfident: boolean;
    draftWhenReadyScore: number;
    allowUserJump: boolean;
    phaseTimeouts: {
      [key: string]: number; // minutes per phase
    };
  };
  
  // Response Configuration
  responseConfig: {
    tone: 'professional' | 'friendly' | 'empathetic' | 'direct';
    warmth: 'low' | 'medium' | 'high';
    responseStyle: 'concise' | 'balanced' | 'detailed';
    includeReflections: boolean;
    probeOnUncertainty: boolean;
    maxProbeDepth: number;
    useEmoji: boolean;
    useMarkdown: boolean;
  };
  
  // Knowledge Base
  knowledgeBase: {
    coparentingPrinciples: string[];
    communicationTemplates: {
      [key: string]: string;
    };
    glossaryTerms: {
      [key: string]: string;
    };
    resourceLinks: {
      title: string;
      url: string;
      description: string;
    }[];
  };
  
  // Safety & Moderation
  safety: {
    escalationDetection: 'off' | 'standard' | 'sensitive';
    contentFiltering: 'minimal' | 'moderate' | 'strict';
    mandatoryDisclaimer: boolean;
    disclaimerText: string;
    emergencyResources: string[];
    blocklistTerms: string[];
  };
  
  // Analytics & Monitoring
  monitoring: {
    logAllConversations: boolean;
    trackPhaseProgression: boolean;
    captureDropoffPoints: boolean;
    feedbackCollection: 'none' | 'optional' | 'required';
    performanceMetrics: boolean;
  };
  
  // Experimental Features
  experimental: {
    enableVoiceInput: boolean;
    enableMultiLanguage: boolean;
    enableSentimentAnalysis: boolean;
    enableContextMemory: boolean;
    betaFeatures: string[];
  };
}

// Default configuration
export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  systemInstructions: {
    mainPrompt: `You are BeAligned™ Beta Lite — a warm, grounded reflection assistant for co-parents. Your role is to help one parent prepare a CLEAR message for their co-parent by guiding them through structured reflection phases.

CLEAR means:
- Concise: Brief and to the point
- Listener-Ready: Considerate of the recipient's perspective
- Essential: Focused on what matters most
- Appropriate: Suitable for the situation
- Relevant: Directly related to co-parenting

PHASE INDICATORS: Always start your responses with [Phase X: Name] to indicate the current phase:
- [Phase 1: Name It] - Identifying the situation
- [Phase 2: Beneath] - Exploring underlying feelings
- [Phase 3: Why] - Understanding why it matters
- [Phase 4: Co-Parent] - Considering their perspective
- [Phase 5: Child] - Focusing on child's needs
- [Phase 6: Options] - Exploring solutions
- [Phase 7: Choose] - Crafting the message

Important: You are NOT a therapist, mediator, or legal advisor. You simply help organize thoughts.`,
    reflectionPhases: {
      name_it: "Help the user identify and name the specific situation or concern they want to address.",
      beneath: "Explore what's beneath the surface - underlying feelings, needs, or concerns.",
      why: "Understand why this matters to them and their co-parenting relationship.",
      coparent: "Consider the co-parent's perspective and potential concerns.",
      child: "Focus on the child's needs and best interests.",
      options: "Brainstorm potential solutions or approaches.",
      choose: "Select the best approach and craft the CLEAR message."
    },
    responseGuidelines: "Keep responses warm but professional. Avoid overuse of empathy. Focus on practical progress toward a CLEAR message.",
    safetyGuidelines: "If you detect escalation, offer a pause. Never provide legal or therapeutic advice.",
    disclaimers: "This is not therapy or legal advice. For emergencies, contact appropriate professionals."
  },
  
  aiModel: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 800,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    stopSequences: []
  },
  
  conversationFlow: {
    autoAdvance: 'smart',
    maxFollowupsPerPhase: 2,
    skipIfConfident: true,
    draftWhenReadyScore: 0.75,
    allowUserJump: true,
    phaseTimeouts: {
      name_it: 5,
      beneath: 5,
      why: 5,
      coparent: 5,
      child: 5,
      options: 10,
      choose: 10
    }
  },
  
  responseConfig: {
    tone: 'empathetic',
    warmth: 'high',
    responseStyle: 'balanced',
    includeReflections: true,
    probeOnUncertainty: true,
    maxProbeDepth: 2,
    useEmoji: false,
    useMarkdown: true
  },
  
  knowledgeBase: {
    coparentingPrinciples: [
      "Focus on the child's best interests",
      "Maintain respectful communication",
      "Be consistent across households",
      "Support the child's relationship with both parents",
      "Keep adult issues separate from parenting"
    ],
    communicationTemplates: {
      schedule_change: "I need to discuss a schedule adjustment for [date]. [Reason]. Would [alternative] work for you?",
      concern: "I've noticed [observation] and I'm concerned about [impact on child]. Can we discuss how to address this?",
      appreciation: "I wanted to thank you for [specific action]. It really helped [positive impact]."
    },
    glossaryTerms: {
      "CLEAR": "Concise, Listener-Ready, Essential, Appropriate, Relevant",
      "Parallel Parenting": "A co-parenting approach with minimal direct contact",
      "Bird's Nest": "Children stay in one home while parents rotate"
    },
    resourceLinks: [
      {
        title: "Co-Parenting Communication Guide",
        url: "https://example.com/guide",
        description: "Best practices for effective co-parent communication"
      }
    ]
  },
  
  safety: {
    escalationDetection: 'standard',
    contentFiltering: 'moderate',
    mandatoryDisclaimer: true,
    disclaimerText: "This service provides communication support only. It is not therapy or legal advice.",
    emergencyResources: [
      "National Domestic Violence Hotline: 1-800-799-7233",
      "Crisis Text Line: Text HOME to 741741"
    ],
    blocklistTerms: []
  },
  
  monitoring: {
    logAllConversations: true,
    trackPhaseProgression: true,
    captureDropoffPoints: true,
    feedbackCollection: 'optional',
    performanceMetrics: true
  },
  
  experimental: {
    enableVoiceInput: false,
    enableMultiLanguage: false,
    enableSentimentAnalysis: false,
    enableContextMemory: false,
    betaFeatures: []
  }
};

interface AdminConfigCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: AdminConfig) => void;
}

// Preset templates for common scenarios
const PRESET_TEMPLATES = {
  'high-conflict': {
    name: 'High Conflict Co-Parenting',
    description: 'For situations with significant tension',
    config: {
      responseConfig: {
        tone: 'professional' as const,
        warmth: 'low' as const,
        responseStyle: 'concise' as const,
        includeReflections: false,
        probeOnUncertainty: false,
        maxProbeDepth: 1,
        useEmoji: false,
        useMarkdown: true
      },
      safety: {
        escalationDetection: 'sensitive' as const,
        contentFiltering: 'strict' as const,
        mandatoryDisclaimer: true
      },
      conversationFlow: {
        autoAdvance: 'manual' as const,
        skipIfConfident: false
      }
    }
  },
  'collaborative': {
    name: 'Collaborative Co-Parenting',
    description: 'For cooperative relationships',
    config: {
      responseConfig: {
        tone: 'friendly' as const,
        warmth: 'high' as const,
        responseStyle: 'balanced' as const,
        includeReflections: true,
        probeOnUncertainty: true,
        maxProbeDepth: 3,
        useEmoji: true,
        useMarkdown: true
      },
      safety: {
        escalationDetection: 'standard' as const,
        contentFiltering: 'minimal' as const,
        mandatoryDisclaimer: false
      },
      conversationFlow: {
        autoAdvance: 'smart' as const,
        skipIfConfident: true
      }
    }
  },
  'new-separation': {
    name: 'Newly Separated',
    description: 'For recently separated parents',
    config: {
      responseConfig: {
        tone: 'empathetic' as const,
        warmth: 'high' as const,
        responseStyle: 'detailed' as const,
        includeReflections: true,
        probeOnUncertainty: true,
        maxProbeDepth: 2,
        useEmoji: false,
        useMarkdown: true
      },
      safety: {
        escalationDetection: 'sensitive' as const,
        contentFiltering: 'moderate' as const,
        mandatoryDisclaimer: true
      },
      conversationFlow: {
        autoAdvance: 'manual' as const,
        skipIfConfident: false
      }
    }
  }
};

export const AdminConfigCenter: React.FC<AdminConfigCenterProps> = ({ 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { userType, user } = useAuth();
  const [activeTab, setActiveTab] = useState('instructions');
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showPresets, setShowPresets] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Load existing configuration and analytics
  useEffect(() => {
    if (isOpen) {
      loadConfiguration();
      loadAnalytics();
    }
  }, [isOpen]);
  
  const loadAnalytics = () => {
    const summary = settingsTracker.getAnalyticsSummary();
    const recommendations = settingsTracker.getRecommendations();
    setAnalytics({ summary, recommendations });
  };

  const loadConfiguration = async () => {
    try {
      const settings = await assistantSettingsApi.getSettings();
      if (settings.data && settings.data.length > 0) {
        const activeSettings = settings.data.find((s: any) => s.is_active);
        // Config is stored in metadata.config
        if (activeSettings?.metadata?.config) {
          // Merge with defaults to ensure all fields exist
          setConfig({
            ...DEFAULT_ADMIN_CONFIG,
            ...activeSettings.metadata.config
          });
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const updateConfig = <K extends keyof AdminConfig>(
    section: K,
    value: AdminConfig[K]
  ) => {
    const previousValue = config[section];
    
    setConfig(prev => ({
      ...prev,
      [section]: value
    }));
    
    // Track the change
    settingsTracker.trackChange({
      userId: user?.id || 'unknown',
      userType: userType || 'unknown',
      changeType: 'manual_change',
      section,
      previousValue,
      newValue: value
    });
    
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Save to backend
      await assistantSettingsApi.updateSettings({
        name: 'Admin Configuration',
        config: config,
        is_active: true
      });
      
      // Save to localStorage as backup
      localStorage.setItem('bealigned_admin_config', JSON.stringify(config));
      
      // Update settings tracker with new config
      settingsTracker.setCurrentConfig(config);
      
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      onSave?.(config);
      
      // Reload analytics after save
      loadAnalytics();
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      const previousConfig = { ...config };
      setConfig(DEFAULT_ADMIN_CONFIG);
      
      // Track the reset
      settingsTracker.trackChange({
        userId: user?.id || 'unknown',
        userType: userType || 'unknown',
        changeType: 'reset',
        previousValue: previousConfig,
        newValue: DEFAULT_ADMIN_CONFIG
      });
      
      setHasUnsavedChanges(true);
    }
  };
  
  const applyPreset = (presetKey: string) => {
    const preset = PRESET_TEMPLATES[presetKey as keyof typeof PRESET_TEMPLATES];
    if (preset && window.confirm(`Apply the "${preset.name}" preset? This will override current settings.`)) {
      const previousConfig = { ...config };
      
      // Merge preset config with current config
      const mergedConfig = { ...config };
      
      // Deep merge the preset config
      Object.entries(preset.config).forEach(([section, values]) => {
        mergedConfig[section as keyof AdminConfig] = {
          ...mergedConfig[section as keyof AdminConfig],
          ...values
        } as any;
      });
      
      // Track the preset application
      settingsTracker.trackChange({
        userId: user?.id || 'unknown',
        userType: userType || 'unknown',
        changeType: 'preset_applied',
        presetName: preset.name,
        previousValue: previousConfig,
        newValue: mergedConfig
      });
      
      setConfig(mergedConfig);
      setHasUnsavedChanges(true);
      setShowPresets(false);
    }
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bealigned-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setConfig({ ...DEFAULT_ADMIN_CONFIG, ...imported });
          setHasUnsavedChanges(true);
        } catch (error) {
          alert('Failed to import configuration. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center">
                <CpuChipIcon className="h-7 w-7 mr-2" />
                Admin Configuration Center
              </h2>
              <p className="text-indigo-100 mt-1">
                Complete control over BeAligned™ system configuration
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center text-sm"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center text-sm"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Preset Templates
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Configuration Performance Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-500">Overall Completion Rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(analytics.summary.overallCompletionRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Conversations (30d)</p>
                <p className="text-xl font-semibold text-gray-900">
                  {analytics.summary.totalConversations}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-500">Config Changes (Recent)</p>
                <p className="text-xl font-semibold text-gray-900">
                  {analytics.summary.recentChanges.length}
                </p>
              </div>
            </div>
            
            {analytics.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-xs font-medium text-yellow-800 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {analytics.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-xs text-yellow-700 flex items-start">
                      <span className="mr-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Preset Templates Dropdown */}
        {showPresets && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Apply Preset Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="font-medium text-gray-900">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 overflow-x-auto p-2">
            {[
              { id: 'instructions', label: 'System Instructions', icon: DocumentTextIcon },
              { id: 'ai', label: 'AI Model', icon: CpuChipIcon },
              { id: 'flow', label: 'Conversation Flow', icon: ArrowPathIcon },
              { id: 'response', label: 'Response Config', icon: ChatBubbleLeftRightIcon },
              { id: 'knowledge', label: 'Knowledge Base', icon: BookOpenIcon },
              { id: 'safety', label: 'Safety', icon: ShieldCheckIcon },
              { id: 'monitoring', label: 'Monitoring', icon: BeakerIcon },
              { id: 'experimental', label: 'Experimental', icon: SparklesIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          
          {/* System Instructions Tab */}
          {activeTab === 'instructions' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <strong>System Instructions</strong> define the core personality and behavior of the AI assistant.
                    These are sent with every request to maintain consistency.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Main System Prompt
                  <span className="ml-2 text-xs text-gray-500">
                    (Primary instructions for the AI)
                  </span>
                </label>
                <textarea
                  value={config.systemInstructions.mainPrompt}
                  onChange={(e) => updateConfig('systemInstructions', {
                    ...config.systemInstructions,
                    mainPrompt: e.target.value
                  })}
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Enter the main system prompt..."
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                  Reflection Phase Instructions
                </h3>
                <div className="space-y-3">
                  {Object.entries(config.systemInstructions.reflectionPhases).map(([phase, instruction]) => (
                    <div key={phase} className="flex items-start space-x-3">
                      <div className="w-32">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {phase.replace('_', ' ')}
                        </span>
                      </div>
                      <textarea
                        value={instruction}
                        onChange={(e) => updateConfig('systemInstructions', {
                          ...config.systemInstructions,
                          reflectionPhases: {
                            ...config.systemInstructions.reflectionPhases,
                            [phase]: e.target.value
                          }
                        })}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Response Guidelines
                  </label>
                  <textarea
                    value={config.systemInstructions.responseGuidelines}
                    onChange={(e) => updateConfig('systemInstructions', {
                      ...config.systemInstructions,
                      responseGuidelines: e.target.value
                    })}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Safety Guidelines
                  </label>
                  <textarea
                    value={config.systemInstructions.safetyGuidelines}
                    onChange={(e) => updateConfig('systemInstructions', {
                      ...config.systemInstructions,
                      safetyGuidelines: e.target.value
                    })}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Model Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={config.aiModel.provider}
                    onChange={(e) => updateConfig('aiModel', {
                      ...config.aiModel,
                      provider: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Model
                  </label>
                  <select
                    value={config.aiModel.model}
                    onChange={(e) => updateConfig('aiModel', {
                      ...config.aiModel,
                      model: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Temperature
                    <span className="ml-2 text-xs text-gray-500">
                      ({config.aiModel.temperature.toFixed(2)})
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.aiModel.temperature}
                    onChange={(e) => updateConfig('aiModel', {
                      ...config.aiModel,
                      temperature: parseFloat(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused (0.0)</span>
                    <span>Balanced (1.0)</span>
                    <span>Creative (2.0)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={config.aiModel.maxTokens}
                      onChange={(e) => updateConfig('aiModel', {
                        ...config.aiModel,
                        maxTokens: parseInt(e.target.value) || 0
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Top P
                      <span className="ml-2 text-xs text-gray-500">
                        ({config.aiModel.topP.toFixed(2)})
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.aiModel.topP}
                      onChange={(e) => updateConfig('aiModel', {
                        ...config.aiModel,
                        topP: parseFloat(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Frequency Penalty
                      <span className="ml-2 text-xs text-gray-500">
                        ({config.aiModel.frequencyPenalty.toFixed(2)})
                      </span>
                    </label>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={config.aiModel.frequencyPenalty}
                      onChange={(e) => updateConfig('aiModel', {
                        ...config.aiModel,
                        frequencyPenalty: parseFloat(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Presence Penalty
                      <span className="ml-2 text-xs text-gray-500">
                        ({config.aiModel.presencePenalty.toFixed(2)})
                      </span>
                    </label>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={config.aiModel.presencePenalty}
                      onChange={(e) => updateConfig('aiModel', {
                        ...config.aiModel,
                        presencePenalty: parseFloat(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Flow Tab */}
          {activeTab === 'flow' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <strong>Conversation Flow</strong> controls how the AI guides users through the reflection phases.
                    Smart settings help maintain natural progression while ensuring all important aspects are covered.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phase Advancement Mode
                    <span className="ml-2 text-xs text-gray-500">
                      (How the conversation moves between phases)
                    </span>
                  </label>
                  <select
                    value={config.conversationFlow.autoAdvance}
                    onChange={(e) => updateConfig('conversationFlow', {
                      ...config.conversationFlow,
                      autoAdvance: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="manual">Manual - User explicitly advances</option>
                    <option value="smart">Smart - AI suggests when ready</option>
                    <option value="always">Always - Auto-advance when complete</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Max Follow-ups Per Phase
                    <span className="ml-2 text-xs text-gray-500">
                      (Before suggesting to move on)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.conversationFlow.maxFollowupsPerPhase}
                    onChange={(e) => updateConfig('conversationFlow', {
                      ...config.conversationFlow,
                      maxFollowupsPerPhase: parseInt(e.target.value) || 2
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <input
                      type="checkbox"
                      checked={config.conversationFlow.skipIfConfident}
                      onChange={(e) => updateConfig('conversationFlow', {
                        ...config.conversationFlow,
                        skipIfConfident: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Skip Phases if User Shows Clarity
                  </label>
                  <p className="text-xs text-gray-500">
                    Allow AI to skip phases when user already has clear understanding
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <input
                      type="checkbox"
                      checked={config.conversationFlow.allowUserJump}
                      onChange={(e) => updateConfig('conversationFlow', {
                        ...config.conversationFlow,
                        allowUserJump: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Allow User to Jump Between Phases
                  </label>
                  <p className="text-xs text-gray-500">
                    Let users navigate to any phase directly
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Draft When Ready Score
                  <span className="ml-2 text-xs text-gray-500">
                    ({(config.conversationFlow.draftWhenReadyScore * 100).toFixed(0)}% - When to suggest drafting message)
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.conversationFlow.draftWhenReadyScore}
                  onChange={(e) => updateConfig('conversationFlow', {
                    ...config.conversationFlow,
                    draftWhenReadyScore: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Early (50%)</span>
                  <span>Balanced (75%)</span>
                  <span>Thorough (100%)</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Phase Time Recommendations (minutes)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(config.conversationFlow.phaseTimeouts).map(([phase, minutes]) => (
                    <div key={phase}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {phase.replace('_', ' ')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={minutes}
                        onChange={(e) => updateConfig('conversationFlow', {
                          ...config.conversationFlow,
                          phaseTimeouts: {
                            ...config.conversationFlow.phaseTimeouts,
                            [phase]: parseInt(e.target.value) || 5
                          }
                        })}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Response Configuration Tab */}
          {activeTab === 'response' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <strong>Response Configuration</strong> shapes how the AI communicates - its tone, style, and interaction patterns.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Communication Tone
                  </label>
                  <select
                    value={config.responseConfig.tone}
                    onChange={(e) => updateConfig('responseConfig', {
                      ...config.responseConfig,
                      tone: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="professional">Professional - Clear and formal</option>
                    <option value="friendly">Friendly - Warm and approachable</option>
                    <option value="empathetic">Empathetic - Understanding and supportive</option>
                    <option value="direct">Direct - Straightforward and concise</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Warmth Level
                  </label>
                  <select
                    value={config.responseConfig.warmth}
                    onChange={(e) => updateConfig('responseConfig', {
                      ...config.responseConfig,
                      warmth: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low - Minimal emotional expression</option>
                    <option value="medium">Medium - Balanced warmth</option>
                    <option value="high">High - Very warm and supportive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Response Length
                  </label>
                  <select
                    value={config.responseConfig.responseStyle}
                    onChange={(e) => updateConfig('responseConfig', {
                      ...config.responseConfig,
                      responseStyle: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="concise">Concise - Brief and to the point</option>
                    <option value="balanced">Balanced - Moderate detail</option>
                    <option value="detailed">Detailed - Comprehensive responses</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Response Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={config.responseConfig.includeReflections}
                      onChange={(e) => updateConfig('responseConfig', {
                        ...config.responseConfig,
                        includeReflections: e.target.checked
                      })}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Include Reflections</span>
                      <p className="text-xs text-gray-500">Mirror back what the user shares to show understanding</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={config.responseConfig.probeOnUncertainty}
                      onChange={(e) => updateConfig('responseConfig', {
                        ...config.responseConfig,
                        probeOnUncertainty: e.target.checked
                      })}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Probe When Uncertain</span>
                      <p className="text-xs text-gray-500">Ask clarifying questions when user input is unclear</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={config.responseConfig.useEmoji}
                      onChange={(e) => updateConfig('responseConfig', {
                        ...config.responseConfig,
                        useEmoji: e.target.checked
                      })}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Use Emoji</span>
                      <p className="text-xs text-gray-500">Include occasional emoji for warmth</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={config.responseConfig.useMarkdown}
                      onChange={(e) => updateConfig('responseConfig', {
                        ...config.responseConfig,
                        useMarkdown: e.target.checked
                      })}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Use Formatting</span>
                      <p className="text-xs text-gray-500">Use bold, italics, and lists for clarity</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Maximum Clarification Depth
                  <span className="ml-2 text-xs text-gray-500">
                    ({config.responseConfig.maxProbeDepth} follow-up questions before moving on)
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={config.responseConfig.maxProbeDepth}
                  onChange={(e) => updateConfig('responseConfig', {
                    ...config.responseConfig,
                    maxProbeDepth: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>No probing</span>
                  <span>Moderate (2-3)</span>
                  <span>Thorough (5)</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Safety Tab */}
          {activeTab === 'safety' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-800">
                    <strong>Safety Settings</strong> ensure appropriate boundaries and provide resources when escalation is detected.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Escalation Detection Sensitivity
                  </label>
                  <select
                    value={config.safety.escalationDetection}
                    onChange={(e) => updateConfig('safety', {
                      ...config.safety,
                      escalationDetection: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="off">Off - No detection</option>
                    <option value="standard">Standard - Detect clear escalation</option>
                    <option value="sensitive">Sensitive - Early detection of tension</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Content Filtering Level
                  </label>
                  <select
                    value={config.safety.contentFiltering}
                    onChange={(e) => updateConfig('safety', {
                      ...config.safety,
                      contentFiltering: e.target.value as any
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="minimal">Minimal - Allow most content</option>
                    <option value="moderate">Moderate - Filter harmful content</option>
                    <option value="strict">Strict - Conservative filtering</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={config.safety.mandatoryDisclaimer}
                    onChange={(e) => updateConfig('safety', {
                      ...config.safety,
                      mandatoryDisclaimer: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium text-gray-900">Show Mandatory Disclaimer</span>
                </label>
                <textarea
                  value={config.safety.disclaimerText}
                  onChange={(e) => updateConfig('safety', {
                    ...config.safety,
                    disclaimerText: e.target.value
                  })}
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="Disclaimer text..."
                  disabled={!config.safety.mandatoryDisclaimer}
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Emergency Resources</h3>
                <div className="space-y-2">
                  {config.safety.emergencyResources.map((resource, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={resource}
                        onChange={(e) => {
                          const updated = [...config.safety.emergencyResources];
                          updated[index] = e.target.value;
                          updateConfig('safety', {
                            ...config.safety,
                            emergencyResources: updated
                          });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Resource name and contact..."
                      />
                      <button
                        onClick={() => {
                          const updated = config.safety.emergencyResources.filter((_, i) => i !== index);
                          updateConfig('safety', {
                            ...config.safety,
                            emergencyResources: updated
                          });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      updateConfig('safety', {
                        ...config.safety,
                        emergencyResources: [...config.safety.emergencyResources, '']
                      });
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Resource
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <strong>Monitoring & Analytics</strong> helps track usage patterns and improve the service over time.
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.monitoring.logAllConversations}
                    onChange={(e) => updateConfig('monitoring', {
                      ...config.monitoring,
                      logAllConversations: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Log All Conversations</span>
                    <p className="text-xs text-gray-500">Store complete conversation history for analysis</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.monitoring.trackPhaseProgression}
                    onChange={(e) => updateConfig('monitoring', {
                      ...config.monitoring,
                      trackPhaseProgression: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Track Phase Progression</span>
                    <p className="text-xs text-gray-500">Monitor how users move through reflection phases</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.monitoring.captureDropoffPoints}
                    onChange={(e) => updateConfig('monitoring', {
                      ...config.monitoring,
                      captureDropoffPoints: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Capture Drop-off Points</span>
                    <p className="text-xs text-gray-500">Identify where users abandon conversations</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.monitoring.performanceMetrics}
                    onChange={(e) => updateConfig('monitoring', {
                      ...config.monitoring,
                      performanceMetrics: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Performance Metrics</span>
                    <p className="text-xs text-gray-500">Track response times and system performance</p>
                  </div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Feedback Collection
                </label>
                <select
                  value={config.monitoring.feedbackCollection}
                  onChange={(e) => updateConfig('monitoring', {
                    ...config.monitoring,
                    feedbackCollection: e.target.value as any
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="none">None - No feedback collection</option>
                  <option value="optional">Optional - Ask but don't require</option>
                  <option value="required">Required - Must provide feedback</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Experimental Tab */}
          {activeTab === 'experimental' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <SparklesIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                  <div className="text-sm text-purple-800">
                    <strong>Experimental Features</strong> are in beta and may change. Enable at your own risk.
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.experimental.enableVoiceInput}
                    onChange={(e) => updateConfig('experimental', {
                      ...config.experimental,
                      enableVoiceInput: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Voice Input</span>
                    <p className="text-xs text-gray-500">Allow users to speak their responses</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.experimental.enableMultiLanguage}
                    onChange={(e) => updateConfig('experimental', {
                      ...config.experimental,
                      enableMultiLanguage: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Multi-Language Support</span>
                    <p className="text-xs text-gray-500">Enable conversations in multiple languages</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.experimental.enableSentimentAnalysis}
                    onChange={(e) => updateConfig('experimental', {
                      ...config.experimental,
                      enableSentimentAnalysis: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sentiment Analysis</span>
                    <p className="text-xs text-gray-500">Analyze emotional tone of conversations</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.experimental.enableContextMemory}
                    onChange={(e) => updateConfig('experimental', {
                      ...config.experimental,
                      enableContextMemory: e.target.checked
                    })}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Context Memory</span>
                    <p className="text-xs text-gray-500">Remember context across multiple conversations</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Manage templates, principles, and resources available to the AI.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Co-Parenting Principles
                </h3>
                <div className="space-y-2">
                  {config.knowledgeBase.coparentingPrinciples.map((principle, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={principle}
                        onChange={(e) => {
                          const updated = [...config.knowledgeBase.coparentingPrinciples];
                          updated[index] = e.target.value;
                          updateConfig('knowledgeBase', {
                            ...config.knowledgeBase,
                            coparentingPrinciples: updated
                          });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => {
                          const updated = config.knowledgeBase.coparentingPrinciples.filter((_, i) => i !== index);
                          updateConfig('knowledgeBase', {
                            ...config.knowledgeBase,
                            coparentingPrinciples: updated
                          });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      updateConfig('knowledgeBase', {
                        ...config.knowledgeBase,
                        coparentingPrinciples: [...config.knowledgeBase.coparentingPrinciples, '']
                      });
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    + Add Principle
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Reset to Defaults
              </button>
              <button
                onClick={exportConfig}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                Export
              </button>
              <label className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                />
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                Import
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-yellow-600 flex items-center">
                  <span className="h-2 w-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                  Unsaved changes
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Save failed
                </span>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveConfiguration}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  isSaving || !hasUnsavedChanges
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};