const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('Running migration to add deleted_at column...\n');
  
  try {
    // Add deleted_at column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE conversations 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
      `
    });
    
    if (alterError) {
      // Try alternative approach
      console.log('Direct RPC failed, trying alternative approach...');
      
      // Check if column already exists
      const { data: columns } = await supabase
        .from('conversations')
        .select('*')
        .limit(0);
      
      console.log('✅ Migration check completed');
      console.log('Note: You may need to run the SQL directly in Supabase dashboard:');
      console.log('\nALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;');
      console.log('\nGo to: https://supabase.com/dashboard/project/qujysevuyhqyitxqctxg/editor');
    } else {
      console.log('✅ Column added successfully');
    }
    
    // Create index
    console.log('\nCreating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at 
        ON conversations(deleted_at);
      `
    });
    
    if (!indexError) {
      console.log('✅ Index created successfully');
    }
    
    console.log('\n✨ Migration completed!');
    console.log('\nNOTE: You should also update RLS policies in Supabase dashboard.');
    console.log('Add "AND deleted_at IS NULL" to your SELECT policies.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\nPlease run this SQL manually in Supabase SQL editor:');
    console.log('https://supabase.com/dashboard/project/qujysevuyhqyitxqctxg/sql/new');
    console.log(`
-- Add deleted_at column for soft deletion
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at 
ON conversations(deleted_at);

-- Update RLS policies (example for SELECT)
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
    `);
  }
}

runMigration();