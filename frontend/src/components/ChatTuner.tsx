import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';

// Simple settings structure for Phase 1
export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  tone: 'professional' | 'friendly' | 'empathetic';
  responseStyle: 'concise' | 'balanced' | 'detailed';
  autoAdvance: 'manual' | 'smart' | 'always';
  safeguards: 'standard' | 'enhanced';
}

// Default settings optimized for co-parenting conversations
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  maxTokens: 800,
  tone: 'empathetic',
  responseStyle: 'balanced',
  autoAdvance: 'smart',
  safeguards: 'standard'
};

interface ChatTunerProps {
  onSettingsChange?: (settings: ChatSettings) => void;
  initialSettings?: ChatSettings;
}

export const ChatTuner: React.FC<ChatTunerProps> = ({ 
  onSettingsChange, 
  initialSettings = DEFAULT_CHAT_SETTINGS 
}) => {
  const { isAdmin, isExpert, userType } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(initialSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('ChatTuner - Visibility check:', {
      isAdmin,
      isExpert,
      adminModeEnabled,
      shouldShow: adminModeEnabled && (isAdmin || isExpert)
    });
  }, [isAdmin, isExpert, adminModeEnabled]);

  const updateSetting = <K extends keyof ChatSettings>(
    key: K, 
    value: ChatSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    onSettingsChange?.(settings);
    setHasUnsavedChanges(false);
    // Store in localStorage for persistence
    localStorage.setItem('bealigned_chat_settings', JSON.stringify(settings));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_CHAT_SETTINGS);
    setHasUnsavedChanges(true);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bealigned_chat_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved settings:', e);
      }
    }
  }, []);

  // Only show for admins and experts when admin mode is enabled
  if (!adminModeEnabled || (!isAdmin && !isExpert)) {
    return null;
  }

  return (
    <>
      {/* Floating Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110 z-40"
        title="Chat Settings (Admin)"
      >
        <Cog6ToothIcon className="h-6 w-6" />
        {hasUnsavedChanges && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <SparklesIcon className="h-7 w-7 mr-2" />
                    AI Chat Tuner
                  </h2>
                  <p className="text-purple-100 mt-1">
                    Fine-tune how the AI responds to users
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              
              {/* Temperature Setting */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <SparklesIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Creativity Level
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (Temperature: {settings.temperature})
                      </span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      How creative vs. predictable the AI responses should be
                    </p>
                  </div>
                </div>
                <div className="ml-7">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused & Consistent</span>
                    <span>Balanced</span>
                    <span>Creative & Varied</span>
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                      <strong>Current setting:</strong> 
                      {settings.temperature < 0.4 && " Very consistent responses, best for serious topics"}
                      {settings.temperature >= 0.4 && settings.temperature < 0.7 && " Balanced approach, good for most conversations"}
                      {settings.temperature >= 0.7 && " More creative and varied responses, good for brainstorming"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Length */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Response Length
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (Max tokens: {settings.maxTokens})
                      </span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      How long and detailed the AI responses should be
                    </p>
                  </div>
                </div>
                <div className="ml-7">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        updateSetting('responseStyle', 'concise');
                        updateSetting('maxTokens', 400);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.responseStyle === 'concise'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Concise
                    </button>
                    <button
                      onClick={() => {
                        updateSetting('responseStyle', 'balanced');
                        updateSetting('maxTokens', 800);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.responseStyle === 'balanced'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Balanced
                    </button>
                    <button
                      onClick={() => {
                        updateSetting('responseStyle', 'detailed');
                        updateSetting('maxTokens', 1200);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.responseStyle === 'detailed'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {settings.responseStyle === 'concise' && "Quick, to-the-point responses. Best for simple questions."}
                    {settings.responseStyle === 'balanced' && "Moderate detail with good explanations. Recommended for most cases."}
                    {settings.responseStyle === 'detailed' && "Comprehensive responses with full context. Best for complex issues."}
                  </p>
                </div>
              </div>

              {/* Tone Setting */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Conversation Tone
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      The personality and warmth level of AI responses
                    </p>
                  </div>
                </div>
                <div className="ml-7">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateSetting('tone', 'professional')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.tone === 'professional'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Professional
                    </button>
                    <button
                      onClick={() => updateSetting('tone', 'friendly')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.tone === 'friendly'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Friendly
                    </button>
                    <button
                      onClick={() => updateSetting('tone', 'empathetic')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.tone === 'empathetic'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Empathetic
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {settings.tone === 'professional' && "Formal and business-like. Clear boundaries, minimal emotion."}
                    {settings.tone === 'friendly' && "Warm and approachable. Like talking to a helpful colleague."}
                    {settings.tone === 'empathetic' && "Understanding and supportive. Best for emotional or difficult topics."}
                  </p>
                </div>
              </div>

              {/* Auto-Advance Behavior */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <ArrowPathIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Conversation Flow
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      How the AI guides users through the reflection phases
                    </p>
                  </div>
                </div>
                <div className="ml-7">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateSetting('autoAdvance', 'manual')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.autoAdvance === 'manual'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => updateSetting('autoAdvance', 'smart')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.autoAdvance === 'smart'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Smart
                    </button>
                    <button
                      onClick={() => updateSetting('autoAdvance', 'always')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.autoAdvance === 'always'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Always
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {settings.autoAdvance === 'manual' && "Wait for user to explicitly ask to move forward. More user control."}
                    {settings.autoAdvance === 'smart' && "Move forward when it feels natural. Balanced approach."}
                    {settings.autoAdvance === 'always' && "Progress through phases automatically. Keeps conversation moving."}
                  </p>
                </div>
              </div>

              {/* Safety Safeguards */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <ShieldCheckIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-2" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Safety Safeguards
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Protection level for sensitive topics and escalation detection
                    </p>
                  </div>
                </div>
                <div className="ml-7">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSetting('safeguards', 'standard')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.safeguards === 'standard'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => updateSetting('safeguards', 'enhanced')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.safeguards === 'enhanced'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Enhanced
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {settings.safeguards === 'standard' && "Basic safety checks. Suitable for most conversations."}
                    {settings.safeguards === 'enhanced' && "Extra caution with emotional topics. Offers breaks and grounding exercises."}
                  </p>
                </div>
              </div>

              {/* Current Role Indicator */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-900">
                      Editing as: {userType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-purple-600">
                    Changes apply to all conversations
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Reset to Defaults
                </button>
                <div className="flex items-center space-x-3">
                  {hasUnsavedChanges && (
                    <span className="text-sm text-yellow-600 flex items-center">
                      <span className="h-2 w-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSettings}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper hook to use settings in other components
export const useChatSettings = () => {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem('bealigned_chat_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CHAT_SETTINGS;
      }
    }
    return DEFAULT_CHAT_SETTINGS;
  });

  return settings;
};