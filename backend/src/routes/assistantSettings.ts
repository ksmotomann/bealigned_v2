import express from 'express';
import { supabaseAdmin } from '../services/supabase';
import multer from 'multer';
import OpenAI from 'openai';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all assistant settings (super admin only)
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('assistant_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching assistant settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active assistant setting
router.get('/active', async (req, res) => {
  try {
    console.log('Fetching active assistant setting...');
    
    const { data, error } = await supabaseAdmin
      .from('assistant_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active setting:', error);
      throw error;
    } // PGRST116 = no rows found

    console.log('Active setting found:', data ? data.id : 'none');
    res.json(data || null);
  } catch (error: any) {
    console.error('Error fetching active assistant setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific assistant setting
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('assistant_settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching assistant setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new assistant setting (super admin only)
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Not authenticated');

    const newSetting = {
      ...req.body,
      created_by: user.id,
      updated_by: user.id
    };

    const { data, error } = await supabaseAdmin
      .from('assistant_settings')
      .insert(newSetting)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error creating assistant setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an assistant setting (super admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Not authenticated');

    // Remove id, created_at, created_by from updates to avoid conflicts
    const { id: removeId, created_at, created_by, updated_at, updated_by, ...updateData } = req.body;

    const updates = {
      ...updateData,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    console.log('Updating assistant setting:', id, 'with data:', updates);

    const { data, error } = await supabaseAdmin
      .from('assistant_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating assistant setting:', error);
      throw error;
    }

    console.log('Successfully updated assistant setting:', data);
    res.json(data);
  } catch (error: any) {
    console.error('Error updating assistant setting:', error);
    res.status(500).json({ error: error.message, details: error });
  }
});

// Activate a specific assistant setting (super admin only)
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Not authenticated');

    // The database trigger will automatically deactivate other settings
    const { data, error } = await supabaseAdmin
      .from('assistant_settings')
      .update({ 
        is_active: true,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error activating assistant setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an assistant setting (super admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('assistant_settings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting assistant setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload a knowledge base file for an assistant setting
router.post('/:id/files', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Not authenticated');

    // Check if file is text-based (markdown, txt, etc)
    const textTypes = ['text/plain', 'text/markdown', 'text/x-markdown', 'application/x-markdown'];
    const isTextFile = textTypes.includes(file.mimetype) || 
                       file.originalname.endsWith('.md') || 
                       file.originalname.endsWith('.txt');

    let fileContent = null;
    let openaiFileId = null;

    if (isTextFile) {
      // Store text content directly
      fileContent = file.buffer.toString('utf-8');
      
      // Optionally upload to OpenAI for retrieval
      if (process.env.OPENAI_API_KEY) {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const openaiFile = await openai.files.create({
            file: new File([file.buffer], file.originalname, { type: file.mimetype }),
            purpose: 'assistants'
          });
          openaiFileId = openaiFile.id;
        } catch (error) {
          console.error('Failed to upload to OpenAI:', error);
        }
      }
    }

    // Store file reference in database
    const { data, error } = await supabaseAdmin
      .from('knowledge_base_files')
      .insert({
        assistant_setting_id: id,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_content: fileContent,
        openai_file_id: openaiFileId,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error uploading knowledge base file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge base files for an assistant setting
router.get('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('knowledge_base_files')
      .select('*')
      .eq('assistant_setting_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching knowledge base files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a knowledge base file
router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file info first to delete from OpenAI if needed
    const { data: fileData } = await supabaseAdmin
      .from('knowledge_base_files')
      .select('openai_file_id')
      .eq('id', fileId)
      .single();

    // Delete from OpenAI if file was uploaded there
    if (fileData?.openai_file_id && process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // @ts-ignore - del method exists but types are outdated
        await openai.files.del(fileData.openai_file_id as string);
      } catch (error) {
        console.error('Failed to delete from OpenAI:', error);
      }
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('knowledge_base_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting knowledge base file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;