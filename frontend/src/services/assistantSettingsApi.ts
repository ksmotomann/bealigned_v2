import { supabase } from './supabase';

export interface AssistantSettings {
  id: string;
  name: string;
  instructions: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

class AssistantSettingsApi {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }

  async getAll(): Promise<AssistantSettings[]> {
    const { data, error } = await supabase
      .from('assistant_settings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch assistant settings: ${error.message}`);
    }
    
    return data || [];
  }

  async getActive(): Promise<AssistantSettings | null> {
    const { data, error } = await supabase
      .from('assistant_settings')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to fetch active assistant setting: ${error.message}`);
    }
    
    return data;
  }

  async getById(id: string): Promise<AssistantSettings> {
    const { data, error } = await supabase
      .from('assistant_settings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch assistant setting: ${error.message}`);
    }
    
    return data;
  }

  async create(settings: Omit<AssistantSettings, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AssistantSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('assistant_settings')
      .insert({
        ...settings,
        created_by: user?.id,
        updated_by: user?.id
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create assistant setting: ${error.message}`);
    }
    
    return data;
  }

  async update(id: string, updates: Partial<AssistantSettings>): Promise<AssistantSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('assistant_settings')
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update assistant setting: ${error.message}`);
    }
    
    return data;
  }

  async activate(id: string): Promise<AssistantSettings> {
    // First deactivate all others
    await supabase
      .from('assistant_settings')
      .update({ is_active: false })
      .neq('id', id);
    
    // Then activate this one
    const { data, error } = await supabase
      .from('assistant_settings')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to activate assistant setting: ${error.message}`);
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('assistant_settings')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete assistant setting: ${error.message}`);
    }
  }

  async uploadFile(settingId: string, file: File): Promise<KnowledgeBaseFile> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Upload file to Supabase Storage
    const fileName = `${settingId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assistant-files')
      .upload(fileName, file);
    
    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    // Store file metadata
    const { data, error } = await supabase
      .from('knowledge_base_files')
      .insert({
        assistant_setting_id: settingId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: uploadData.path,
        metadata: {},
        created_by: user?.id
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save file metadata: ${error.message}`);
    }
    
    return data;
  }

  async getFiles(settingId: string): Promise<KnowledgeBaseFile[]> {
    const { data, error } = await supabase
      .from('knowledge_base_files')
      .select('*')
      .eq('assistant_setting_id', settingId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }
    
    return data || [];
  }

  async deleteFile(settingId: string, fileId: string): Promise<void> {
    // Get file info first
    const { data: fileData } = await supabase
      .from('knowledge_base_files')
      .select('file_url')
      .eq('id', fileId)
      .single();
    
    // Delete from storage if exists
    if (fileData?.file_url) {
      await supabase.storage
        .from('assistant-files')
        .remove([fileData.file_url]);
    }
    
    // Delete metadata
    const { error } = await supabase
      .from('knowledge_base_files')
      .delete()
      .eq('id', fileId);
    
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Alias methods for AdminConfigCenter compatibility
  async getSettings(): Promise<{ data: AssistantSettings[] }> {
    const settings = await this.getAll();
    return { data: settings };
  }

  async updateSettings(settings: { name: string; config: any; is_active: boolean }): Promise<AssistantSettings> {
    // Find active setting or create new one
    const allSettings = await this.getAll();
    const activeSettings = allSettings.find(s => s.is_active);
    
    if (activeSettings) {
      // Update existing active settings
      return this.update(activeSettings.id, {
        name: settings.name,
        metadata: { config: settings.config },
        is_active: settings.is_active
      });
    } else {
      // Create new settings
      return this.create({
        name: settings.name,
        instructions: 'System configured via Admin Config Center',
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        metadata: { config: settings.config },
        is_active: settings.is_active
      });
    }
  }
}

export interface KnowledgeBaseFile {
  id: string;
  assistant_setting_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_content?: string;
  openai_file_id?: string;
  file_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  created_by: string;
}

export const assistantSettingsApi = new AssistantSettingsApi();