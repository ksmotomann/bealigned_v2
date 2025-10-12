-- Update match_bealigned_chunks to exclude conversation samples
-- and prioritize methodology content over examples

CREATE OR REPLACE FUNCTION match_bealigned_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.6,
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
    chunks.id,
    chunks.parent_content_id,
    chunks.content,
    chunks.phase_number,
    chunks.situation_tags,
    1 - (chunks.embedding::vector <=> query_embedding) AS similarity,
    chunks.metadata
  FROM bealigned_content_chunks chunks
  INNER JOIN bealigned_content parent ON chunks.parent_content_id = parent.id
  WHERE
    -- Only include chunks with embeddings
    chunks.embedding IS NOT NULL
    -- EXCLUDE conversation samples - prioritize methodology, theory, governance
    AND NOT (parent.tags @> ARRAY['gpt_samples', 'conversation_patterns']::text[])
    -- Filter by phase if specified (null means get all phases)
    AND (filter_phase IS NULL OR chunks.phase_number = filter_phase OR chunks.phase_number IS NULL)
    -- Only return results above threshold
    AND 1 - (chunks.embedding::vector <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding::vector <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_bealigned_chunks IS 'Performs semantic similarity search on bealigned_content_chunks, EXCLUDING conversation samples. Prioritizes methodology, theory, governance, and program content over example conversations.';
