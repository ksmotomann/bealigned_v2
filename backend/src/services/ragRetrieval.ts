import OpenAI from 'openai';
import { supabaseAdmin } from './supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGSettings {
  enabled: boolean;
  k: number; // Top-k chunks to retrieve
  minScore: number; // Minimum similarity score
  hybridWeight: number; // 0-1, weight between keyword vs vector search
  maxPerDoc: number; // Max chunks per document
  rerankTopN: number; // Number of candidates before reranking
  maxTokens: number; // Max context tokens
  enforceACL: boolean; // Enforce user access control
}

export interface RetrievedChunk {
  id: string;
  content: string;
  summary: string;
  score: number;
  documentName: string;
  headingPath?: string;
  pageFrom?: number;
  pageTo?: number;
  citation: string;
}

export interface RAGContext {
  chunks: RetrievedChunk[];
  contextText: string;
  totalTokens: number;
  sourceCount: number;
}

export class RAGRetrieval {
  
  static async retrieveContext(
    query: string, 
    userId: string, 
    settings: RAGSettings
  ): Promise<RAGContext> {
    
    if (!settings.enabled) {
      return {
        chunks: [],
        contextText: '',
        totalTokens: 0,
        sourceCount: 0
      };
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Perform hybrid search
      const candidates = await this.hybridSearch(
        query, 
        queryEmbedding, 
        userId, 
        settings
      );
      
      // Rerank and filter
      const reranked = await this.rerankChunks(query, candidates, settings);
      
      // Build context with citations
      const context = this.buildContext(reranked, settings);
      
      return context;
      
    } catch (error) {
      console.error('RAG retrieval error:', error);
      // Return empty context on error to avoid breaking chat
      return {
        chunks: [],
        contextText: '',
        totalTokens: 0,
        sourceCount: 0
      };
    }
  }

  private static async generateQueryEmbedding(query: string): Promise<number[]> {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    
    return embeddingResponse.data[0].embedding;
  }

  private static async hybridSearch(
    query: string,
    queryEmbedding: number[],
    userId: string,
    settings: RAGSettings
  ): Promise<Array<{
    id: string;
    content: string;
    summary: string;
    document_name: string;
    heading_path?: string;
    page_from?: number;
    page_to?: number;
    vector_score: number;
    keyword_score: number;
  }>> {
    
    // Vector similarity search
    const vectorQuery = `
      SELECT 
        c.id,
        c.content,
        c.summary,
        d.original_name as document_name,
        c.heading_path,
        c.page_from,
        c.page_to,
        (c.embedding <=> $1::vector) as vector_distance,
        1 - (c.embedding <=> $1::vector) as vector_score
      FROM rag_document_chunks c
      JOIN rag_documents d ON c.document_id = d.id
      WHERE c.user_id = $2
        AND d.processed = true
      ORDER BY c.embedding <=> $1::vector
      LIMIT $3
    `;

    // Keyword search using full-text search
    const keywordQuery = `
      SELECT 
        c.id,
        c.content,
        c.summary,
        d.original_name as document_name,
        c.heading_path,
        c.page_from,
        c.page_to,
        ts_rank_cd(to_tsvector('english', c.content), plainto_tsquery('english', $1)) as keyword_score
      FROM rag_document_chunks c
      JOIN rag_documents d ON c.document_id = d.id
      WHERE c.user_id = $2
        AND d.processed = true
        AND to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
      ORDER BY keyword_score DESC
      LIMIT $3
    `;

    // Execute both searches
    const [vectorResults, keywordResults] = await Promise.all([
      supabaseAdmin.rpc('exec_raw_sql', {
        query: vectorQuery,
        params: [JSON.stringify(queryEmbedding), userId, settings.rerankTopN]
      }),
      supabaseAdmin.rpc('exec_raw_sql', {
        query: keywordQuery,
        params: [query, userId, settings.rerankTopN]
      })
    ]);

    // Merge and deduplicate results
    const allResults = new Map();

    // Add vector results
    if (vectorResults.data) {
      vectorResults.data.forEach((result: any) => {
        allResults.set(result.id, {
          ...result,
          vector_score: result.vector_score || 0,
          keyword_score: 0
        });
      });
    }

    // Add/update with keyword results
    if (keywordResults.data) {
      keywordResults.data.forEach((result: any) => {
        const existing = allResults.get(result.id);
        if (existing) {
          existing.keyword_score = result.keyword_score || 0;
        } else {
          allResults.set(result.id, {
            ...result,
            vector_score: 0,
            keyword_score: result.keyword_score || 0
          });
        }
      });
    }

    return Array.from(allResults.values());
  }

  private static async rerankChunks(
    query: string,
    candidates: any[],
    settings: RAGSettings
  ): Promise<RetrievedChunk[]> {
    
    // Calculate hybrid scores
    const scored = candidates.map(candidate => ({
      ...candidate,
      hybrid_score: (
        candidate.vector_score * settings.hybridWeight + 
        candidate.keyword_score * (1 - settings.hybridWeight)
      )
    }));

    // Filter by minimum score
    const filtered = scored.filter(chunk => 
      chunk.hybrid_score >= settings.minScore
    );

    // Sort by hybrid score
    const sorted = filtered.sort((a, b) => b.hybrid_score - a.hybrid_score);

    // Apply per-document limits
    const perDocCount = new Map();
    const limited = sorted.filter(chunk => {
      const docName = chunk.document_name;
      const count = perDocCount.get(docName) || 0;
      if (count >= settings.maxPerDoc) {
        return false;
      }
      perDocCount.set(docName, count + 1);
      return true;
    });

    // Take top-k
    const topK = limited.slice(0, settings.k);

    // Convert to RetrievedChunk format
    return topK.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      summary: chunk.summary,
      score: chunk.hybrid_score,
      documentName: chunk.document_name,
      headingPath: chunk.heading_path,
      pageFrom: chunk.page_from,
      pageTo: chunk.page_to,
      citation: this.buildCitation(
        chunk.document_name,
        chunk.heading_path,
        chunk.page_from,
        chunk.page_to
      )
    }));
  }

  private static buildCitation(
    documentName: string,
    headingPath?: string,
    pageFrom?: number,
    pageTo?: number
  ): string {
    let citation = documentName;
    
    if (headingPath) {
      citation += ` — ${headingPath}`;
    }
    
    if (pageFrom && pageTo) {
      if (pageFrom === pageTo) {
        citation += ` — p.${pageFrom}`;
      } else {
        citation += ` — p.${pageFrom}-${pageTo}`;
      }
    } else if (pageFrom) {
      citation += ` — p.${pageFrom}`;
    }
    
    return citation;
  }

  private static buildContext(chunks: RetrievedChunk[], settings: RAGSettings): RAGContext {
    if (chunks.length === 0) {
      return {
        chunks: [],
        contextText: '',
        totalTokens: 0,
        sourceCount: 0
      };
    }

    let contextText = "## Retrieved Context\n\n";
    let totalTokens = 20; // Account for header tokens
    const sourceSet = new Set<string>();

    for (const chunk of chunks) {
      const chunkText = `**[${chunk.citation}]**\n${chunk.content}\n\n`;
      const chunkTokens = Math.ceil(chunkText.split(/\s+/).length * 1.3);
      
      // Check if adding this chunk would exceed token limit
      if (totalTokens + chunkTokens > settings.maxTokens) {
        break;
      }
      
      contextText += chunkText;
      totalTokens += chunkTokens;
      sourceSet.add(chunk.documentName);
    }

    return {
      chunks,
      contextText: contextText.trim(),
      totalTokens,
      sourceCount: sourceSet.size
    };
  }

  // Helper method to get retrieval statistics
  static async getRetrievalStats(userId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    processedDocuments: number;
    avgChunksPerDoc: number;
  }> {
    const [docsResult, chunksResult] = await Promise.all([
      supabaseAdmin
        .from('rag_documents')
        .select('processed', { count: 'exact' })
        .eq('user_id', userId),
      supabaseAdmin
        .from('rag_document_chunks')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
    ]);

    const totalDocuments = docsResult.count || 0;
    const processedDocuments = docsResult.data?.filter(d => d.processed).length || 0;
    const totalChunks = chunksResult.count || 0;
    const avgChunksPerDoc = processedDocuments > 0 ? totalChunks / processedDocuments : 0;

    return {
      totalDocuments,
      totalChunks,
      processedDocuments,
      avgChunksPerDoc
    };
  }
}