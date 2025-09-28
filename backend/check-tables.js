const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to Supabase project...');
console.log('Project URL:', supabaseUrl);
console.log('Project ID:', supabaseUrl.split('.')[0].replace('https://', ''));

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTables() {
  console.log('\nChecking for existing tables...\n');
  
  const tables = ['profiles', 'conversations', 'messages', 'refinements'];
  let tablesExist = false;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}' does not exist`);
        } else {
          console.log(`⚠️  Table '${table}' error: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
        tablesExist = true;
      }
    } catch (err) {
      console.log(`❌ Table '${table}' - ${err.message}`);
    }
  }
  
  if (!tablesExist) {
    console.log('\n⚠️  NO TABLES FOUND IN YOUR SUPABASE PROJECT!');
    console.log('\n📋 To create the tables:');
    console.log('1. Go to your Supabase SQL Editor:');
    console.log(`   https://app.supabase.com/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new`);
    console.log('2. Copy and paste the contents of create-tables.sql');
    console.log('3. Click "Run" to execute the SQL');
    console.log('\nThe create-tables.sql file has been created in the project root directory.');
  } else {
    console.log('\n✅ Tables are set up in your Supabase project!');
  }
  
  // Try to check auth configuration
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (!error) {
      console.log(`\n📊 Auth status: ${users.length} users registered`);
    }
  } catch (err) {
    console.log('\n⚠️  Could not check auth status');
  }
}

checkTables();