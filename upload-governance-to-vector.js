const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = 'https://oohrdabehxzzwdmpmcfv.supabase.co';
const supabaseKey = envVars.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const openaiApiKey = envVars.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate embeddings using OpenAI
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Chunk text into smaller pieces (max ~1000 chars each for good embeddings)
function chunkText(text, maxChunkSize = 1000) {
  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function uploadDocument(filePath, contentType, title, tags, description) {
  console.log(`\n📄 Processing: ${title}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Read file
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`   File size: ${content.length} chars`);

  // Generate embedding for full document
  console.log('   Generating document embedding...');
  const docEmbedding = await generateEmbedding(content.substring(0, 8000)); // Use first 8k chars for doc embedding

  // Insert main document
  console.log('   Inserting main document...');
  const { data: docData, error: docError } = await supabase
    .from('bealigned_content')
    .insert({
      content_type: contentType,
      title: title,
      content: content,
      version: 1,
      status: 'active',
      tags: tags,
      metadata: {
        file_path: filePath,
        description: description,
        uploaded_at: new Date().toISOString()
      },
      embedding: docEmbedding
    })
    .select('id')
    .single();

  if (docError) {
    console.error('   ❌ Error inserting document:', docError.message);
    return;
  }

  const documentId = docData.id;
  console.log(`   ✅ Document created: ${documentId}`);

  // Chunk the content
  console.log('\n   Chunking content...');
  const chunks = chunkText(content, 1000);
  console.log(`   Created ${chunks.length} chunks`);

  // Insert chunks with embeddings
  console.log('\n   Generating embeddings and inserting chunks...');
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Show progress every 10 chunks
    if (i % 10 === 0) {
      console.log(`   Progress: ${i + 1}/${chunks.length} chunks...`);
    }

    try {
      const chunkEmbedding = await generateEmbedding(chunk);

      await supabase
        .from('bealigned_content_chunks')
        .insert({
          parent_content_id: documentId,
          chunk_index: i,
          content: chunk,
          embedding: chunkEmbedding,
          phase_number: null, // Governance documents apply to all phases
          situation_tags: tags,
          metadata: {
            chunk_size: chunk.length,
            document_title: title
          }
        });

      // Rate limit: wait 100ms between API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`   ⚠️ Error processing chunk ${i}:`, err.message);
    }
  }

  console.log(`\n   ✅ Successfully uploaded ${chunks.length} chunks`);
}

async function main() {
  console.log('╔═════════════════════════════════════════════════════════╗');
  console.log('║   Uploading Governance Documents to Vector Database    ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');

  try {
    // Upload original GPT governance blueprint
    await uploadDocument(
      'assets/2025_1011_BE_Gov1_Robert.md',
      'governance_blueprint',
      'GPT Governance Blueprint - Complete Architecture (Adapted for OpenAI)',
      ['gpt_governance', 'architecture', 'blueprint', 'target_state', 'reference_design', 'openai'],
      'Complete BeAligned architecture blueprint from GPT showing target state. Originally designed for Claude but adapted for OpenAI (gpt-4o). Includes CLEAR system, structured outputs, and full governance model.'
    );

    // Upload gap analysis
    await uploadDocument(
      'GOVERNANCE_GAP_ANALYSIS.md',
      'gap_analysis',
      'Current Implementation vs GPT Blueprint - Gap Analysis (v1.0)',
      ['gap_analysis', 'current_state', 'alignment_assessment', 'recommendations', 'openai', 'versioned'],
      'Detailed comparison between current BeAligned implementation (OpenAI-based) and GPT governance blueprint. Includes architectural decisions, priority recommendations, and alignment score. Version-controlled document that will be updated as gaps close.'
    );

    console.log('\n╔═════════════════════════════════════════════════════════╗');
    console.log('║              ✅ Upload Complete!                        ║');
    console.log('╚═════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log('   • 2 documents uploaded to bealigned_content');
    console.log('   • Chunks created in bealigned_content_chunks');
    console.log('   • Embeddings generated for all content');
    console.log('   • Tagged for easy retrieval\n');

    console.log('🔍 To verify:');
    console.log('   SELECT * FROM bealigned_content WHERE tags @> \'{"gpt_governance"}\';\n');

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

main();
