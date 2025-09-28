-- Knowledge Base Document Storage Tables
-- Stores uploaded documents and knowledge base articles

-- Documents table for storing uploaded files metadata
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  category_id UUID,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table for organizing knowledge base content
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table for processed knowledge base content
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source_document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
  source_document JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key relationship for category_id in documents
ALTER TABLE knowledge_documents 
ADD CONSTRAINT fk_knowledge_documents_category 
FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE SET NULL;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_user_id ON knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category_id ON knowledge_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_processed ON knowledge_documents(processed);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at ON knowledge_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_user_id ON knowledge_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_created_at ON knowledge_categories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_user_id ON knowledge_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category_id ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_source_document_id ON knowledge_articles(source_document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_created_at ON knowledge_articles(created_at DESC);

-- Full text search index on articles content
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_content_search 
ON knowledge_articles USING gin(to_tsvector('english', title || ' ' || content));

-- Tags GIN index for array operations
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tags ON knowledge_articles USING gin(tags);

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_knowledge_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_knowledge_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_knowledge_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at updates
DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_documents_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_categories_updated_at ON knowledge_categories;
CREATE TRIGGER update_knowledge_categories_updated_at
    BEFORE UPDATE ON knowledge_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_categories_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_articles_updated_at ON knowledge_articles;
CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_articles_updated_at();

-- Row Level Security policies
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents"
  ON knowledge_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON knowledge_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON knowledge_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON knowledge_documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
  ON knowledge_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON knowledge_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON knowledge_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON knowledge_categories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for articles
CREATE POLICY "Users can view their own articles"
  ON knowledge_articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
  ON knowledge_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
  ON knowledge_articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
  ON knowledge_articles FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies for super admins to manage all knowledge base content
CREATE POLICY "Admins can view all documents"
  ON knowledge_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view all categories"
  ON knowledge_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view all articles"
  ON knowledge_articles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Comments for documentation
COMMENT ON TABLE knowledge_documents IS 'Stores metadata and extracted text from uploaded documents';
COMMENT ON TABLE knowledge_categories IS 'Categories for organizing knowledge base content';
COMMENT ON TABLE knowledge_articles IS 'Processed articles created from documents or manually entered';

COMMENT ON COLUMN knowledge_documents.extracted_text IS 'Text content extracted from the uploaded document';
COMMENT ON COLUMN knowledge_documents.metadata IS 'Additional metadata like page count, word count, etc.';
COMMENT ON COLUMN knowledge_articles.source_document IS 'Reference to the original document if article was created from upload';
COMMENT ON COLUMN knowledge_articles.tags IS 'Array of tags for categorizing and searching articles';