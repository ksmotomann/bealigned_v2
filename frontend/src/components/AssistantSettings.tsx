import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assistantSettingsApi, AssistantSettings, KnowledgeBaseFile } from '../services/assistantSettingsApi';
import { useAuth } from '../contexts/CustomAuthContext';
import { useAdminModeContext } from '../contexts/AdminModeContext';
import { CheckCircleIcon, PencilIcon, DocumentTextIcon, DocumentArrowUpIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export const AssistantSettingsManager: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { adminModeEnabled } = useAdminModeContext();
  const navigate = useNavigate();
  const [activeSetting, setActiveSetting] = useState<AssistantSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<AssistantSettings>>({
    name: 'Main Configuration',
    instructions: '',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    max_tokens: 4000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    metadata: {}
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeBaseFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadSettings();
    }
  }, [isSuperAdmin]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Get the active setting or the first one
      const activeSettingData = await assistantSettingsApi.getActive();
      
      if (activeSettingData) {
        setActiveSetting(activeSettingData);
        setFormData(activeSettingData);
        loadKnowledgeFiles(activeSettingData.id);
      } else {
        // If no settings exist, we'll create one when saving
        console.log('No active settings found, will create on save');
      }
    } catch (error) {
      console.error('Failed to load assistant settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeFiles = async (settingId: string) => {
    try {
      const files = await assistantSettingsApi.getFiles(settingId);
      setKnowledgeFiles(files);
    } catch (error) {
      console.error('Failed to load knowledge files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSetting) return;

    // Check file type
    const allowedTypes = ['.md', '.txt', '.markdown'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload a .md, .txt, or .markdown file');
      return;
    }

    try {
      setUploadingFile(true);
      const uploadedFile = await assistantSettingsApi.uploadFile(activeSetting.id, file);
      setKnowledgeFiles([...knowledgeFiles, uploadedFile]);
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!activeSetting) return;
    
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await assistantSettingsApi.deleteFile(activeSetting.id, fileId);
      setKnowledgeFiles(knowledgeFiles.filter(f => f.id !== fileId));
      alert('File deleted successfully');
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (activeSetting) {
        // Update existing setting
        const updatedSetting = await assistantSettingsApi.update(activeSetting.id, formData);
        setActiveSetting(updatedSetting);
        setFormData(updatedSetting);
        alert('Settings saved successfully');
      } else {
        // Create new setting if none exists
        const newSetting = await assistantSettingsApi.create({
          ...formData as Omit<AssistantSettings, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
          is_active: true
        });
        setActiveSetting(newSetting);
        setFormData(newSetting);
        loadKnowledgeFiles(newSetting.id);
        alert('Settings created and activated successfully');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save assistant setting:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-600">Access denied. Super admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading assistant settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(adminModeEnabled ? '/admin' : '/home')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={adminModeEnabled ? "Back to Admin Dashboard" : "Back to Home"}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">OpenAI Assistant Settings</h1>
          </div>
          <p className="text-gray-600 mt-1">Configure the AI assistant behavior and parameters</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Action Buttons */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Settings
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      if (activeSetting) {
                        setFormData(activeSetting);
                      }
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
            {activeSetting && (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Active Configuration</span>
              </div>
            )}
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                System Instructions
              </label>
              <p className="text-xs text-gray-500 mb-2">
                The main instructions that define how the AI assistant behaves and responds. This shapes the assistant's personality, approach, and conversation style.
              </p>
              {isEditing ? (
                <textarea
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="Enter the full system instructions for the AI assistant..."
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
                    {formData.instructions || 'No instructions configured'}
                  </pre>
                </div>
              )}
            </div>

            {/* Model Settings */}
            <div className="grid grid-cols-2 gap-6">
              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  GPT-4 Turbo = Latest, most capable, best for complex reasoning. GPT-4 = Very capable, good balance. GPT-3.5 Turbo = Faster, more cost-effective, good for simpler tasks. <strong>Standard GPT: GPT-4 or GPT-4 Turbo</strong> for best quality.
                </p>
                {isEditing ? (
                  <select
                    value={formData.model || 'gpt-4-turbo-preview'}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo Preview</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{formData.model}</p>
                )}
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature ({formData.temperature || 0})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Controls randomness: Lower (0-0.5) = more focused, consistent, and deterministic responses. Higher (0.7-2) = more creative, varied, and unpredictable responses. <strong>Standard GPT: 0.7-0.9</strong> balances consistency with creativity.
                </p>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature || 0.7}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-900">{formData.temperature}</p>
                )}
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Maximum response length (1 token ≈ 4 characters). Lower values (500-1000) = shorter, more concise responses. Higher values (2000-4000) = longer, more detailed responses. <strong>Standard GPT: 2000-4000</strong> for comprehensive responses.
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.max_tokens || 4000}
                    onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="128000"
                  />
                ) : (
                  <p className="text-gray-900">{formData.max_tokens}</p>
                )}
              </div>

              {/* Top P */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top P ({formData.top_p || 1})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Alternative to temperature. Lower values (0.1-0.5) = considers fewer word choices, more focused. Higher values (0.9-1.0) = considers more options, more diverse vocabulary. <strong>Standard GPT: 1.0</strong> (typically not adjusted).
                </p>
                {isEditing ? (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.top_p || 1.0}
                    onChange={(e) => setFormData({ ...formData, top_p: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-900">{formData.top_p}</p>
                )}
              </div>

              {/* Frequency Penalty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency Penalty ({formData.frequency_penalty || 0})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Reduces repetition. Negative values (-2 to -0.5) = allows more repetition. Positive values (0.5 to 2) = discourages repeating the same words/phrases. <strong>Standard GPT: 0</strong> (neutral, no penalty).
                </p>
                {isEditing ? (
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={formData.frequency_penalty || 0.0}
                    onChange={(e) => setFormData({ ...formData, frequency_penalty: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-900">{formData.frequency_penalty}</p>
                )}
              </div>

              {/* Presence Penalty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presence Penalty ({formData.presence_penalty || 0})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Encourages topic diversity. Negative values (-2 to -0.5) = stays on current topics longer. Positive values (0.5 to 2) = more likely to introduce new topics/ideas. <strong>Standard GPT: 0</strong> (neutral, natural flow).
                </p>
                {isEditing ? (
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={formData.presence_penalty || 0.0}
                    onChange={(e) => setFormData({ ...formData, presence_penalty: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-900">{formData.presence_penalty}</p>
                )}
              </div>
            </div>

            {/* Knowledge Base Files */}
            {activeSetting && (
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentArrowUpIcon className="inline h-4 w-4 mr-1" />
                  Knowledge Base Files
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload markdown or text files to provide additional context to the assistant.
                </p>
                
                {/* File Upload */}
                <div className="mb-4">
                  <label className="relative cursor-pointer bg-indigo-50 rounded-md px-4 py-2 border-2 border-dashed border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 transition-colors inline-block">
                    <span className="text-sm text-indigo-600 font-medium">
                      {uploadingFile ? 'Uploading...' : 'Upload File (.md, .txt)'}
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".md,.txt,.markdown"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>
                </div>
                
                {/* Files List */}
                {knowledgeFiles.length > 0 ? (
                  <div className="space-y-2">
                    {knowledgeFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                              {file.openai_file_id && ' • Synced to OpenAI'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No knowledge base files uploaded</p>
                )}
              </div>
            )}

            {/* Status */}
            {activeSetting && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(activeSetting.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Updated: {new Date(activeSetting.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};