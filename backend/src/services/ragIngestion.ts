import OpenAI from 'openai';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DocumentChunk {
  content: string;
  contentMarkdown?: string;
  headingPath?: string;
  pageFrom?: number;
  pageTo?: number;
  tokenCount: number;
  summary: string;
  embedding: number[];
  metadata: any;
}

export class RAGIngestion {
  
  static async ingestDocument(
    userId: string,
    filePath: string,
    originalName: string,
    fileType: string,
    fileSize: number,
    extractedText: string,
    tags: string[] = []
  ): Promise<string> {
    try {
      // Calculate SHA256 hash for idempotency
      const sha256Hash = crypto
        .createHash('sha256')
        .update(extractedText)
        .digest('hex');

      // Check if document already exists
      const { data: existingDoc } = await supabaseAdmin
        .from('rag_documents')
        .select('id')
        .eq('user_id', userId)
        .eq('sha256_hash', sha256Hash)
        .single();

      if (existingDoc) {
        console.log('Document already exists, skipping ingestion');
        return existingDoc.id;
      }

      // Create document record
      const { data: document, error: docError } = await supabaseAdmin
        .from('rag_documents')
        .insert({
          user_id: userId,
          original_name: originalName,
          file_type: fileType,
          file_size: fileSize,
          sha256_hash: sha256Hash,
          storage_uri: filePath, // In production, this would be an S3/cloud storage URI
          extracted_text: extractedText,
          tags,
          processed: false
        })
        .select()
        .single();

      if (docError) {
        throw new Error(`Failed to create document record: ${docError.message}`);
      }

      // Process document into chunks
      const chunks = await this.chunkDocument(extractedText, originalName);
      
      // Generate embeddings and summaries for each chunk
      const processedChunks = await this.processChunks(chunks);
      
      // Store chunks in database
      await this.storeChunks(document.id, userId, processedChunks);
      
      // Mark document as processed
      await supabaseAdmin
        .from('rag_documents')
        .update({ 
          processed: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', document.id);

      console.log(`Successfully ingested document: ${originalName} (${processedChunks.length} chunks)`);
      return document.id;

    } catch (error: any) {
      console.error('RAG ingestion error:', error);
      
      // Log processing error if document was created
      const sha256Hash = crypto.createHash('sha256').update(extractedText).digest('hex');
      await supabaseAdmin
        .from('rag_documents')
        .update({ 
          processing_error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('sha256_hash', sha256Hash);
      
      throw error;
    }
  }

  private static async chunkDocument(text: string, filename: string): Promise<Array<{
    content: string;
    headingPath?: string;
    pageFrom?: number;
    pageTo?: number;
  }>> {
    // Simple chunking strategy - in production you'd use more sophisticated methods
    const CHUNK_SIZE = 800; // tokens (approximated as words * 1.3)
    const OVERLAP = 120;
    const words = text.split(/\s+/);
    const chunks = [];

    // Approximate token calculation (rough estimate)
    const wordsPerChunk = Math.floor(CHUNK_SIZE / 1.3);
    const overlapWords = Math.floor(OVERLAP / 1.3);

    for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      if (chunkWords.length === 0) break;

      const content = chunkWords.join(' ');
      
      // Try to detect headings (lines that start with #, are all caps, or are short and end with :)
      const lines = content.split('\n');
      const headingPath = this.extractHeadingPath(lines);
      
      chunks.push({
        content,
        headingPath,
        // For PDFs, you could extract page numbers here
        pageFrom: Math.floor(i / (wordsPerChunk * 10)) + 1, // Rough page estimation
        pageTo: Math.floor((i + wordsPerChunk) / (wordsPerChunk * 10)) + 1
      });
    }

    return chunks;
  }

  private static extractHeadingPath(lines: string[]): string | undefined {
    const headings = lines
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('#') || // Markdown heading
               (trimmed.length < 100 && trimmed.endsWith(':')) || // Colon heading
               (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && trimmed.length > 5); // All caps heading
      })
      .map(line => line.replace(/^#+\s*/, '').replace(/:$/, '').trim())
      .slice(0, 3); // Max 3 levels

    return headings.length > 0 ? headings.join(' > ') : undefined;
  }

  private static async processChunks(chunks: Array<{
    content: string;
    headingPath?: string;
    pageFrom?: number;
    pageTo?: number;
  }>): Promise<DocumentChunk[]> {
    const processed = [];

    for (const chunk of chunks) {
      try {
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk.content,
        });

        // Generate summary
        const summary = await this.generateSummary(chunk.content);
        
        // Count tokens (rough approximation)
        const tokenCount = Math.ceil(chunk.content.split(/\s+/).length * 1.3);

        processed.push({
          content: chunk.content,
          headingPath: chunk.headingPath,
          pageFrom: chunk.pageFrom,
          pageTo: chunk.pageTo,
          tokenCount,
          summary,
          embedding: embeddingResponse.data[0].embedding,
          metadata: {
            model: "text-embedding-3-small",
            timestamp: new Date().toISOString()
          }
        });

        // Rate limiting - avoid hitting OpenAI limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error('Error processing chunk:', error);
        // Continue with other chunks even if one fails
      }
    }

    return processed;
  }

  private static async generateSummary(content: string): Promise<string> {
    try {
      if (content.length < 200) {
        // For short content, just return the first sentence or two
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '.' : '');
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `Summarize this text in 1-2 neutral, informative sentences:\n\n${content.substring(0, 1000)}`
        }],
        max_tokens: 100,
        temperature: 0.3
      });

      return completion.choices[0]?.message?.content?.trim() || 
             content.substring(0, 200) + '...';
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to simple truncation
      return content.substring(0, 200) + '...';
    }
  }

  private static async storeChunks(
    documentId: string, 
    userId: string, 
    chunks: DocumentChunk[]
  ): Promise<void> {
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      user_id: userId,
      chunk_index: index,
      content: chunk.content,
      content_markdown: chunk.contentMarkdown,
      heading_path: chunk.headingPath,
      page_from: chunk.pageFrom,
      page_to: chunk.pageTo,
      token_count: chunk.tokenCount,
      summary: chunk.summary,
      embedding: JSON.stringify(chunk.embedding), // pgvector will handle this
      metadata: chunk.metadata
    }));

    const { error } = await supabaseAdmin
      .from('rag_document_chunks')
      .insert(chunkRecords);

    if (error) {
      throw new Error(`Failed to store chunks: ${error.message}`);
    }
  }

  static async deleteDocument(userId: string, documentId: string): Promise<void> {
    // Delete chunks first (cascade should handle this, but being explicit)
    await supabaseAdmin
      .from('rag_document_chunks')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', userId);

    // Delete document
    const { error } = await supabaseAdmin
      .from('rag_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}