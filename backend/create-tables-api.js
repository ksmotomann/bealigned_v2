const https = require('https');

const accessToken = 'sbp_619266f54f3a610a70db8c91fa07bc95c392e6b1';
const projectRef = 'qujysevuyhqyitxqctxg';

const sqlCommands = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  
  `CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    thread_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  )`,
  
  `CREATE TABLE IF NOT EXISTS public.refinements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    original_content TEXT NOT NULL,
    refined_content TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  )`,
  
  `CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_refinements_message_id ON public.refinements(message_id)`,
  
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.refinements ENABLE ROW LEVEL SECURITY`,
];

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(responseData);
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function createTables() {
  console.log('🚀 Creating tables in Supabase using Management API...\n');
  
  for (const sql of sqlCommands) {
    const shortDesc = sql.split('\n')[0].substring(0, 50) + '...';
    try {
      await executeSql(sql);
      console.log(`✅ ${shortDesc}`);
    } catch (error) {
      console.log(`⚠️  ${shortDesc} - ${error.message}`);
    }
  }
  
  console.log('\n✨ Table creation attempt complete!');
  console.log('\nVerify your tables at:');
  console.log('https://supabase.com/dashboard/project/qujysevuyhqyitxqctxg/editor');
}

createTables();