import { supabase } from '../services/supabase';

export interface DocumentChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
    wordCount: number;
    hasHeader?: boolean;
    headerText?: string;
    section?: string;
  };
}

export interface ProcessedDocument {
  documentId: string;
  chunks: DocumentChunk[];
  totalChunks: number;
  totalWords: number;
  summary?: string;
}

/**
 * Document processing utilities for AI-optimized chunking
 * Implements best practices for LLM context management
 */
export class DocumentProcessor {
  // Optimal chunk size for most LLMs (in characters)
  private static readonly CHUNK_SIZE = 2000;
  private static readonly CHUNK_OVERLAP = 200; // Overlap to maintain context
  private static readonly MAX_CHUNKS_PER_PROMPT = 3; // Max chunks to include in a single prompt

  /**
   * Process a document into optimized chunks for AI processing
   */
  static async processDocument(
    documentId: string,
    content: string,
    fileName: string
  ): Promise<ProcessedDocument> {
    // Clean and normalize the content
    const cleanedContent = this.cleanContent(content);
    
    // Detect document structure (headers, sections, etc.)
    const structure = this.detectStructure(cleanedContent);
    
    // Create intelligent chunks based on structure
    const chunks = this.createSmartChunks(cleanedContent, structure);
    
    // Generate document summary for context
    const summary = this.generateSummary(cleanedContent, chunks);
    
    // Save chunks to database
    await this.saveChunks(documentId, chunks);
    
    // Update document metadata
    await this.updateDocumentMetadata(documentId, {
      chunk_count: chunks.length,
      processing_status: 'completed',
      metadata: {
        fileName,
        totalWords: this.countWords(cleanedContent),
        structure,
        summary
      }
    });
    
    return {
      documentId,
      chunks,
      totalChunks: chunks.length,
      totalWords: this.countWords(cleanedContent),
      summary
    };
  }

  /**
   * Clean and normalize document content
   */
  private static cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, '  ') // Replace tabs with spaces
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .replace(/[^\S\n]+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Detect document structure (headers, sections, lists, etc.)
   */
  private static detectStructure(content: string): any {
    const lines = content.split('\n');
    const structure = {
      headers: [] as { level: number; text: string; lineIndex: number }[],
      sections: [] as { title: string; startLine: number; endLine: number }[],
      lists: [] as { type: 'bullet' | 'numbered'; startLine: number; endLine: number }[]
    };

    lines.forEach((line, index) => {
      // Detect headers (markdown style or uppercase lines)
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        structure.headers.push({
          level,
          text: line.replace(/^#+\s*/, ''),
          lineIndex: index
        });
      } else if (line.length > 0 && line === line.toUpperCase() && line.match(/[A-Z]/)) {
        structure.headers.push({
          level: 1,
          text: line,
          lineIndex: index
        });
      }

      // Detect lists
      if (line.match(/^[\*\-\+]\s+/) || line.match(/^\d+\.\s+/)) {
        const type = line.match(/^\d+\./) ? 'numbered' : 'bullet';
        const lastList = structure.lists[structure.lists.length - 1];
        
        if (lastList && lastList.endLine === index - 1 && lastList.type === type) {
          lastList.endLine = index;
        } else {
          structure.lists.push({ type, startLine: index, endLine: index });
        }
      }
    });

    // Create sections based on headers
    structure.headers.forEach((header, i) => {
      const nextHeader = structure.headers[i + 1];
      structure.sections.push({
        title: header.text,
        startLine: header.lineIndex,
        endLine: nextHeader ? nextHeader.lineIndex - 1 : lines.length - 1
      });
    });

    return structure;
  }

  /**
   * Create smart chunks based on document structure
   */
  private static createSmartChunks(content: string, structure: any): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const lines = content.split('\n');
    
    // If we have sections, chunk by section
    if (structure.sections.length > 0) {
      structure.sections.forEach((section: any, sectionIndex: number) => {
        const sectionContent = lines
          .slice(section.startLine, section.endLine + 1)
          .join('\n');
        
        // If section is too large, split it into smaller chunks
        if (sectionContent.length > this.CHUNK_SIZE) {
          const subChunks = this.splitIntoChunks(sectionContent, this.CHUNK_SIZE, this.CHUNK_OVERLAP);
          subChunks.forEach((subChunk, subIndex) => {
            chunks.push({
              content: subChunk,
              metadata: {
                chunkIndex: chunks.length,
                startChar: section.startLine * 50, // Approximate
                endChar: section.endLine * 50,
                wordCount: this.countWords(subChunk),
                hasHeader: subIndex === 0,
                headerText: section.title,
                section: section.title
              }
            });
          });
        } else {
          chunks.push({
            content: sectionContent,
            metadata: {
              chunkIndex: chunks.length,
              startChar: section.startLine * 50,
              endChar: section.endLine * 50,
              wordCount: this.countWords(sectionContent),
              hasHeader: true,
              headerText: section.title,
              section: section.title
            }
          });
        }
      });
    } else {
      // No clear structure, use sliding window approach
      const rawChunks = this.splitIntoChunks(content, this.CHUNK_SIZE, this.CHUNK_OVERLAP);
      rawChunks.forEach((chunk, index) => {
        chunks.push({
          content: chunk,
          metadata: {
            chunkIndex: index,
            startChar: index * (this.CHUNK_SIZE - this.CHUNK_OVERLAP),
            endChar: Math.min(
              (index + 1) * (this.CHUNK_SIZE - this.CHUNK_OVERLAP) + this.CHUNK_OVERLAP,
              content.length
            ),
            wordCount: this.countWords(chunk)
          }
        });
      });
    }

    return chunks;
  }

  /**
   * Split text into overlapping chunks
   */
  private static splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at sentence or word boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);
        
        // Prefer breaking at sentence, then paragraph, then word
        if (lastPeriod > start + chunkSize * 0.8) {
          end = lastPeriod + 1;
        } else if (lastNewline > start + chunkSize * 0.8) {
          end = lastNewline;
        } else if (lastSpace > start + chunkSize * 0.8) {
          end = lastSpace;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }
    
    return chunks;
  }

  /**
   * Generate a summary of the document
   */
  private static generateSummary(content: string, chunks: DocumentChunk[]): string {
    // For now, create a simple summary
    // In production, you might use an AI model for this
    const firstChunk = chunks[0]?.content || '';
    const words = firstChunk.split(/\s+/).slice(0, 50).join(' ');
    
    const sections = chunks
      .filter(c => c.metadata.hasHeader)
      .map(c => c.metadata.headerText)
      .filter(Boolean)
      .slice(0, 5);
    
    if (sections.length > 0) {
      return `Document with sections: ${sections.join(', ')}. ${chunks.length} chunks total.`;
    } else {
      return `${words}... (${chunks.length} chunks total)`;
    }
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Save chunks to database
   */
  private static async saveChunks(documentId: string, chunks: DocumentChunk[]): Promise<void> {
    const chunkRecords = chunks.map(chunk => ({
      document_id: documentId,
      chunk_index: chunk.metadata.chunkIndex,
      content: chunk.content,
      metadata: chunk.metadata
    }));

    console.log(`Saving ${chunkRecords.length} chunks for document ${documentId}`);

    const { error } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (error) {
      console.error('Error saving chunks:', error);
      throw error;
    }
    
    console.log(`Successfully saved ${chunkRecords.length} chunks`);
  }

  /**
   * Update document metadata after processing
   */
  private static async updateDocumentMetadata(
    documentId: string,
    metadata: any
  ): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update(metadata)
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document metadata:', error);
      throw error;
    }
  }

  /**
   * Get relevant chunks for a query (for AI context)
   */
  static async getRelevantChunks(
    documentId: string,
    query: string,
    maxChunks: number = 3
  ): Promise<DocumentChunk[]> {
    // For now, return the first N chunks
    // In production, you'd use semantic search with embeddings
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })
      .limit(maxChunks);

    if (error) {
      console.error('Error fetching chunks:', error);
      return [];
    }

    return data.map(chunk => ({
      content: chunk.content,
      metadata: chunk.metadata
    }));
  }

  /**
   * Format chunks for inclusion in AI prompt
   */
  static formatChunksForPrompt(chunks: DocumentChunk[]): string {
    return chunks
      .map((chunk, index) => {
        const header = chunk.metadata.headerText 
          ? `[Section: ${chunk.metadata.headerText}]\n` 
          : '';
        return `${header}${chunk.content}`;
      })
      .join('\n\n---\n\n');
  }
}