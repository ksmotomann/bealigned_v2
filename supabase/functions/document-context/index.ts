import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentContextRequest {
  query: string;
  documentIds?: string[];
  maxChunks?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${authHeader}`,
        },
      },
    });

    const { query, documentIds, maxChunks = 3 } = await req.json() as DocumentContextRequest;

    // Get user's documents if no specific IDs provided
    let finalDocumentIds = documentIds;
    if (!finalDocumentIds || finalDocumentIds.length === 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userDocs } = await supabase
          .from('documents')
          .select('id')
          .eq('user_id', user.id)
          .eq('processed', true)
          .limit(10);
        
        finalDocumentIds = userDocs?.map(d => d.id) || [];
      }
    }

    if (!finalDocumentIds || finalDocumentIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          context: '',
          chunks: [],
          message: 'No documents available' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, get the first N chunks from each document
    // In production, you'd use semantic search with embeddings
    const chunks = [];
    for (const docId of finalDocumentIds.slice(0, 3)) {
      const { data: docChunks } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', docId)
        .order('chunk_index', { ascending: true })
        .limit(Math.ceil(maxChunks / finalDocumentIds.length));
      
      if (docChunks) {
        chunks.push(...docChunks);
      }
    }

    // Format chunks for AI context
    const formattedContext = chunks
      .slice(0, maxChunks)
      .map((chunk, index) => {
        const metadata = chunk.metadata || {};
        const header = metadata.headerText 
          ? `[${metadata.headerText}]\n` 
          : `[Document Segment ${index + 1}]\n`;
        return `${header}${chunk.content}`;
      })
      .join('\n\n---\n\n');

    // Create a summary for the AI
    const contextSummary = `Based on ${chunks.length} document segments from your uploaded materials:\n\n${formattedContext}`;

    return new Response(
      JSON.stringify({
        context: contextSummary,
        chunks: chunks.map(c => ({
          content: c.content,
          metadata: c.metadata
        })),
        documentCount: finalDocumentIds.length,
        chunkCount: chunks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in document-context function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});