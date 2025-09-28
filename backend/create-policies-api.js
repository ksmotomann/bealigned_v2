const https = require('https');

const accessToken = 'sbp_619266f54f3a610a70db8c91fa07bc95c392e6b1';
const projectRef = 'qujysevuyhqyitxqctxg';

const policies = [
  `CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id)`,
    
  `CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)`,
    
  `CREATE POLICY "Users can create own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    
  `CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id)`,
    
  `CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id AND user_id = auth.uid()
      )
    )`,
    
  `CREATE POLICY "Users can view messages from own conversations" ON public.messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id AND user_id = auth.uid()
      )
    )`,
    
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER`,
  
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
  
  `CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`
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

async function createPolicies() {
  console.log('🔒 Creating RLS policies and triggers...\n');
  
  for (const sql of policies) {
    const shortDesc = sql.replace(/\s+/g, ' ').substring(0, 50) + '...';
    try {
      await executeSql(sql);
      console.log(`✅ ${shortDesc}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  ${shortDesc} - Already exists`);
      } else {
        console.log(`⚠️  ${shortDesc} - ${error.message}`);
      }
    }
  }
  
  console.log('\n✨ RLS policies setup complete!');
  console.log('\n🎉 Your BeAligned Lite database is fully configured!');
  console.log('\nYou can now:');
  console.log('1. Register users at http://localhost:3000');
  console.log('2. Start chatting with your OpenAI Assistant');
  console.log('3. View tables at https://supabase.com/dashboard/project/qujysevuyhqyitxqctxg/editor');
}

createPolicies();