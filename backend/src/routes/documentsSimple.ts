import express from 'express';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Simple upload handler
router.post('/upload', authenticate, upload.array('documents', 10), async (req: AuthRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const processedDocuments = [];

    for (const file of req.files) {
      try {
        // Store document metadata in database
        const { data: documentData, error: docError } = await supabaseAdmin
          .from('knowledge_documents')
          .insert({
            user_id: userId,
            original_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size,
            extracted_text: `File uploaded: ${file.originalname}`,
            metadata: {},
            processed: true
          })
          .select()
          .single();

        if (docError) {
          console.error('Database error storing document:', docError);
          throw new Error('Failed to store document metadata');
        }

        processedDocuments.push({
          id: documentData.id,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          processed: true,
          uploadDate: documentData.created_at
        });

      } catch (error: any) {
        console.error('Error processing file:', file.originalname, error);
      }
    }

    res.json({
      success: true,
      processedDocuments,
      createdArticles: [],
      message: `Successfully processed ${processedDocuments.length} documents`
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process documents',
      details: error.message 
    });
  }
});

// Get user's documents
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: documents, error } = await supabaseAdmin
      .from('knowledge_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        originalName: doc.original_name,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        processed: doc.processed,
        uploadDate: doc.created_at,
        categoryId: doc.category_id,
        extractedText: doc.extracted_text
      }))
    });

  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch documents',
      details: error.message 
    });
  }
});

export default router;