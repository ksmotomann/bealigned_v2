-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to search bealigned_content_chunks by semantic similarity
-- Note: Embeddings are stored as text (JSON string), so we convert them to vector type
CREATE OR REPLACE FUNCTION match_bealigned_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_phase int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  parent_content_id uuid,
  content text,
  phase_number int,
  situation_tags text[],
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bealigned_content_chunks.id,
    bealigned_content_chunks.parent_content_id,
    bealigned_content_chunks.content,
    bealigned_content_chunks.phase_number,
    bealigned_content_chunks.situation_tags,
    1 - (bealigned_content_chunks.embedding::vector <=> query_embedding) AS similarity,
    bealigned_content_chunks.metadata
  FROM bealigned_content_chunks
  WHERE
    -- Only include chunks with embeddings
    bealigned_content_chunks.embedding IS NOT NULL
    -- Filter by phase if specified
    AND (filter_phase IS NULL OR bealigned_content_chunks.phase_number = filter_phase OR bealigned_content_chunks.phase_number IS NULL)
    -- Only return results above threshold
    AND 1 - (bealigned_content_chunks.embedding::vector <=> query_embedding) > match_threshold
  ORDER BY bealigned_content_chunks.embedding::vector <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search bealigned_content (main documents) by similarity
CREATE OR REPLACE FUNCTION match_bealigned_content(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  title text,
  content_type text,
  tags text[],
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bealigned_content.id,
    bealigned_content.title,
    bealigned_content.content_type,
    bealigned_content.tags,
    1 - (bealigned_content.embedding::vector <=> query_embedding) AS similarity,
    bealigned_content.metadata
  FROM bealigned_content
  WHERE
    bealigned_content.embedding IS NOT NULL
    AND bealigned_content.status = 'active'
    AND 1 - (bealigned_content.embedding::vector <=> query_embedding) > match_threshold
  ORDER BY bealigned_content.embedding::vector <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Note: Indexes are commented out because embeddings are stored as text (JSON)
-- To enable vector indexes, first convert embedding columns to vector type:
-- ALTER TABLE bealigned_content_chunks ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector;
-- Then uncomment the indexes below:

-- CREATE INDEX IF NOT EXISTS bealigned_content_chunks_embedding_idx
-- ON bealigned_content_chunks
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- CREATE INDEX IF NOT EXISTS bealigned_content_embedding_idx
-- ON bealigned_content
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 10);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_bealigned_chunks TO authenticated, anon;
GRANT EXECUTE ON FUNCTION match_bealigned_content TO authenticated, anon;

-- Comment the functions for documentation
COMMENT ON FUNCTION match_bealigned_chunks IS 'Performs semantic similarity search on bealigned_content_chunks using cosine distance. Returns chunks similar to the query embedding.';
COMMENT ON FUNCTION match_bealigned_content IS 'Performs semantic similarity search on bealigned_content (main documents) using cosine distance.';
