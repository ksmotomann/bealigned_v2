-- Create document_chunks table for AI-optimized document processing
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique chunk index per document
  UNIQUE(document_id, chunk_index)
);

-- Create indexes for efficient querying
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_created ON document_chunks(created_at DESC);

-- Add chunking metadata to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Enable RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_chunks
-- Users can view chunks for their documents
CREATE POLICY "Users can view own document chunks"
  ON document_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_chunks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can create chunks for their documents
CREATE POLICY "Users can create own document chunks"
  ON document_chunks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_chunks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can update chunks for their documents
CREATE POLICY "Users can update own document chunks"
  ON document_chunks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_chunks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can delete chunks for their documents
CREATE POLICY "Users can delete own document chunks"
  ON document_chunks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_chunks.document_id 
      AND documents.user_id = auth.uid()
    )
  );

COMMENT ON TABLE document_chunks IS 'Stores chunked document content for efficient AI processing';
COMMENT ON COLUMN document_chunks.chunk_index IS 'Sequential index of chunk within document';
COMMENT ON COLUMN document_chunks.metadata IS 'Additional metadata like headers, page numbers, etc';