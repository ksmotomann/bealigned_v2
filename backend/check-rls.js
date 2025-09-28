const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const checkRLS = async () => {
  console.log('Checking Row Level Security (RLS) status...\n');
  
  const tables = ['profiles', 'conversations', 'messages', 'refinements'];
  
  for (const table of tables) {
    try {
      // This is a workaround - we'll try to query the table
      // If RLS is enabled without policies, it will return empty for anon users
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('row-level security')) {
        console.log(`✓ RLS is enabled for '${table}' table`);
      } else {
        console.log(`⚠️  RLS might not be enabled for '${table}' table`);
        console.log(`   Please enable it in the Supabase dashboard`);
      }
    } catch (err) {
      console.log(`Could not check RLS for '${table}':`, err.message);
    }
  }
  
  console.log('\n📝 To enable RLS and set up policies:');
  console.log('1. Go to https://app.supabase.com/project/qujysevuyhqyitxqctxg/editor');
  console.log('2. Run the SQL commands from supabase-schema.sql');
  console.log('3. Or use the Table Editor to enable RLS for each table');
  console.log('\nThe SQL file includes all necessary RLS policies for:');
  console.log('- User access to their own data');
  console.log('- Admin access to all data');
  console.log('- Automatic profile creation on signup');
};

checkRLS();