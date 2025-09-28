const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const testConnection = async () => {
  try {
    // Test basic connection by checking if we can query auth.users
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Connection error:', error);
      return;
    }
    
    console.log('✓ Successfully connected to Supabase!');
    console.log('Number of users:', data.users.length);
    
    // Check if tables exist
    const tables = ['profiles', 'conversations', 'messages', 'refinements'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`✗ Table '${table}' not found or accessible`);
      } else {
        console.log(`✓ Table '${table}' exists (${count || 0} rows)`);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

testConnection();