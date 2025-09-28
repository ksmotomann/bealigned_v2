-- Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents metadata table for RAG
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  sha256_hash VARCHAR(64) NOT NULL,
  storage_uri TEXT NOT NULL,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks for RAG retrieval
CREATE TABLE IF NOT EXISTS rag_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES rag_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_markdown TEXT,
  heading_path TEXT,
  page_from INTEGER,
  page_to INTEGER,
  token_count INTEGER NOT NULL,
  summary TEXT,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_documents_user_id ON rag_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_sha256 ON rag_documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_rag_documents_processed ON rag_documents(processed);
CREATE INDEX IF NOT EXISTS idx_rag_documents_tags ON rag_documents USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_user_id ON rag_document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Full-text search index for hybrid search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_content_search 
ON rag_document_chunks USING gin(to_tsvector('english', content));

-- Unique constraint for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_documents_user_sha256 
ON rag_documents(user_id, sha256_hash);

-- RLS policies
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own rag documents" ON rag_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own rag chunks" ON rag_document_chunks FOR ALL USING (auth.uid() = user_id);

-- Admins can access all for debugging
CREATE POLICY "Admins can access all rag documents" ON rag_documents FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('admin', 'super_admin')));

CREATE POLICY "Admins can access all rag chunks" ON rag_document_chunks FOR SELECT TO authenticated  
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type IN ('admin', 'super_admin')));

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_rag_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_rag_documents_updated_at ON rag_documents;
CREATE TRIGGER update_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_documents_updated_at();

-- Add comments for documentation
COMMENT ON TABLE rag_documents IS 'Documents for RAG (Retrieval-Augmented Generation) system';
COMMENT ON TABLE rag_document_chunks IS 'Chunked document content with embeddings for semantic search';
COMMENT ON COLUMN rag_document_chunks.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN rag_documents.sha256_hash IS 'Content hash for deduplication and idempotency';
COMMENT ON COLUMN rag_document_chunks.token_count IS 'Approximate token count for context management';