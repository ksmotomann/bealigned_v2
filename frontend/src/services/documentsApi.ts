import { supabase } from './supabase';
import { customAuth } from './customAuth';
import { DocumentProcessor } from '../utils/documentProcessor';
import { DocumentParser } from '../utils/documentParser';

export interface DocumentUploadResponse {
  success: boolean;
  processedDocuments: {
    id: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    processed: boolean;
    uploadDate: string;
  }[];
  createdArticles: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    lastUpdated: string;
    sourceDocument: {
      filename: string;
      fileSize: number;
      uploadDate: string;
      fileType: string;
    };
  }[];
  message: string;
}

export interface Document {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  processed: boolean;
  uploadDate: string;
  categoryId?: string;
  extractedText?: string;
}

class DocumentsApi {
  private async readFileContent(file: File): Promise<string> {
    try {
      // Use the new DocumentParser for all file types
      const content = await DocumentParser.parseDocument(file);
      
      // Limit content size to prevent database issues
      if (content.length > 500000) { // ~500KB text limit
        return content.substring(0, 500000) + '\n\n[Content truncated due to size...]';
      }
      
      return content;
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      // Return error message instead of throwing
      return `[Error parsing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }
  
  private async getAuthHeaders() {
    const session = customAuth.getSession();
    return {
      'Authorization': `Bearer ${session?.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async getAuthHeadersForUpload() {
    const session = customAuth.getSession();
    return {
      'Authorization': `Bearer ${session?.token}`,
      // Don't set Content-Type for FormData, browser will set it with boundary
    };
  }

  async uploadDocuments(files: FileList, categoryId?: string): Promise<DocumentUploadResponse> {
    console.log('documentsApi.uploadDocuments called with', files.length, 'files');
    
    // For now, we'll store document metadata in Supabase
    // In production, you'd want to upload to Supabase Storage
    const currentUser = customAuth.getUser();
    const session = customAuth.getSession();
    
    console.log('Auth check - User:', currentUser?.id, 'Session:', !!session);
    
    if (!currentUser || !session) {
      console.error('Authentication failed - no user or session');
      throw new Error(`Authentication failed: No user session found`);
    }
    
    const processedDocuments: any[] = [];
    const createdArticles: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Read file content for text extraction
        const content = await this.readFileContent(file);
        
        const doc = {
          id: crypto.randomUUID(),
          filename: file.name,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size,
          processed: true,
          upload_date: new Date().toISOString(),
          category_id: categoryId,
          user_id: currentUser?.id,
          extracted_text: content
        };
        
        // Store document metadata in Supabase
        console.log('Attempting to insert document:', doc);
        
        const { data, error } = await supabase
          .from('documents')
          .insert(doc)
          .select()
          .single();
        
        console.log('Insert result:', { data, error });
        
        if (error) {
          console.error(`Error uploading document ${file.name}:`, error);
          throw new Error(`Database error for ${file.name}: ${error.message}`);
        }
      
        // Process the document into chunks for AI optimization
        if (content && data) {
          try {
            await DocumentProcessor.processDocument(data.id, content, file.name);
            console.log(`Document ${file.name} processed and chunked successfully`);
          } catch (procError) {
            console.error(`Error processing document ${file.name}:`, procError);
            // Update document status to indicate processing error but keep the document
            const errorMessage = procError instanceof Error 
              ? procError.message 
              : JSON.stringify(procError);
            
            try {
              await supabase
                .from('documents')
                .update({ 
                  processing_status: 'error',
                  processing_error: errorMessage
                })
                .eq('id', data.id);
            } catch (updateError) {
              console.error('Failed to update document error status:', updateError);
            }
          }
        }
      
        // Transform database result to match interface
        processedDocuments.push({
          id: data.id,
          originalName: data.original_name,
          fileType: data.file_type,
          fileSize: data.file_size,
          processed: data.processed,
          uploadDate: data.upload_date
        });
      } catch (fileError) {
        console.error(`Failed to process file ${file.name}:`, fileError);
        // Add error info but continue with other files
        processedDocuments.push({
          id: crypto.randomUUID(),
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          processed: false,
          uploadDate: new Date().toISOString(),
          error: String(fileError)
        });
      }
    }
    
    return {
      success: true,
      processedDocuments,
      createdArticles,
      message: 'Documents uploaded successfully'
    };
  }

  async getDocuments(): Promise<{ success: boolean; documents: Document[] }> {
    // Show all documents for administrative purposes
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false });
    
    if (error) throw error;
    
    // Transform snake_case to camelCase for frontend
    const documents = (data || []).map(doc => {
      console.log('Raw document from DB:', doc);
      return {
        id: doc.id,
        originalName: doc.original_name || doc.filename,
        filename: doc.filename || doc.original_name,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        processed: doc.processed,
        uploadDate: doc.upload_date || doc.created_at,
        categoryId: doc.category_id,
        extractedText: doc.extracted_text
      };
    });
    
    return {
      success: true,
      documents
    };
  }

  async getDocumentChunks(documentId: string): Promise<{ success: boolean; chunks: any[] }> {
    console.log('Fetching chunks for document:', documentId);
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });
    
    console.log('Chunks query result:', { data, error });
    if (error) throw error;
    
    return {
      success: true,
      chunks: data || []
    };
  }

  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Document deleted successfully'
    };
  }
}

export const documentsApi = new DocumentsApi();