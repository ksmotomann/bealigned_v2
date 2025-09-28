const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function executeSql(sql, description) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log(`✓ ${description}`);
      return true;
    } else {
      console.log(`⚠️  ${description} - May already exist or need manual setup`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  ${description} - ${error.message}`);
    return false;
  }
}

async function setupRLS() {
  console.log('Setting up Row Level Security and Policies...\n');

  // Enable RLS on tables
  const rlsCommands = [
    { sql: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;', desc: 'Enable RLS on profiles' },
    { sql: 'ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;', desc: 'Enable RLS on conversations' },
    { sql: 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;', desc: 'Enable RLS on messages' },
    { sql: 'ALTER TABLE public.refinements ENABLE ROW LEVEL SECURITY;', desc: 'Enable RLS on refinements' }
  ];

  // Create policies
  const policies = [
    {
      sql: `CREATE POLICY "Users can view own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);`,
      desc: 'Create policy: Users can view own profile'
    },
    {
      sql: `CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);`,
      desc: 'Create policy: Users can update own profile'
    },
    {
      sql: `CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_admin = true
              )
            );`,
      desc: 'Create policy: Admins can view all profiles'
    },
    {
      sql: `CREATE POLICY "Users can view own conversations" ON public.conversations
            FOR SELECT USING (auth.uid() = user_id);`,
      desc: 'Create policy: Users can view own conversations'
    },
    {
      sql: `CREATE POLICY "Users can create own conversations" ON public.conversations
            FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      desc: 'Create policy: Users can create own conversations'
    },
    {
      sql: `CREATE POLICY "Admins can view all conversations" ON public.conversations
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_admin = true
              )
            );`,
      desc: 'Create policy: Admins can view all conversations'
    },
    {
      sql: `CREATE POLICY "Users can view messages from own conversations" ON public.messages
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM public.conversations 
                WHERE id = conversation_id AND user_id = auth.uid()
              )
            );`,
      desc: 'Create policy: Users can view own messages'
    },
    {
      sql: `CREATE POLICY "Users can create messages in own conversations" ON public.messages
            FOR INSERT WITH CHECK (
              EXISTS (
                SELECT 1 FROM public.conversations 
                WHERE id = conversation_id AND user_id = auth.uid()
              )
            );`,
      desc: 'Create policy: Users can create messages'
    },
    {
      sql: `CREATE POLICY "Admins can view all messages" ON public.messages
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_admin = true
              )
            );`,
      desc: 'Create policy: Admins can view all messages'
    },
    {
      sql: `CREATE POLICY "Admins can view refinements" ON public.refinements
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_admin = true
              )
            );`,
      desc: 'Create policy: Admins can view refinements'
    },
    {
      sql: `CREATE POLICY "Admins can create refinements" ON public.refinements
            FOR INSERT WITH CHECK (
              EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_admin = true
              )
            );`,
      desc: 'Create policy: Admins can create refinements'
    }
  ];

  // Create function and trigger
  const functionAndTrigger = [
    {
      sql: `CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
              INSERT INTO public.profiles (id, email, full_name)
              VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
              RETURN new;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      desc: 'Create function: handle_new_user'
    },
    {
      sql: `CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
      desc: 'Create trigger: on_auth_user_created'
    }
  ];

  // Execute RLS commands
  console.log('Enabling Row Level Security...');
  for (const cmd of rlsCommands) {
    await executeSql(cmd.sql, cmd.desc);
  }

  // Execute policies
  console.log('\nCreating Security Policies...');
  for (const policy of policies) {
    await executeSql(policy.sql, policy.desc);
  }

  // Execute function and trigger
  console.log('\nCreating Functions and Triggers...');
  for (const item of functionAndTrigger) {
    await executeSql(item.sql, item.desc);
  }

  console.log('\n✅ RLS setup attempt complete!');
  console.log('\nIf some policies already exist, that\'s okay - they\'re already configured.');
  console.log('\nYou can verify in your Supabase dashboard:');
  console.log('https://app.supabase.com/project/qujysevuyhqyitxqctxg/auth/policies');
}

setupRLS();