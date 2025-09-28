const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const setupDatabase = async () => {
  console.log('Setting up database schema...');

  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    });

    if (profilesError) {
      console.log('Note: profiles table might already exist or needs manual creation');
    } else {
      console.log('✓ Profiles table created');
    }

    // Create conversations table
    const { error: conversationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
          thread_id TEXT NOT NULL,
          title TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    });

    if (conversationsError) {
      console.log('Note: conversations table might already exist or needs manual creation');
    } else {
      console.log('✓ Conversations table created');
    }

    // Create messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    });

    if (messagesError) {
      console.log('Note: messages table might already exist or needs manual creation');
    } else {
      console.log('✓ Messages table created');
    }

    // Create refinements table
    const { error: refinementsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.refinements (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
          admin_id UUID REFERENCES public.profiles(id) NOT NULL,
          original_content TEXT NOT NULL,
          refined_content TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
      `
    });

    if (refinementsError) {
      console.log('Note: refinements table might already exist or needs manual creation');
    } else {
      console.log('✓ Refinements table created');
    }

    console.log('\nDatabase setup attempt complete!');
    console.log('\nIMPORTANT: If tables were not created automatically, please:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the SQL script from supabase-schema.sql');
    
  } catch (error) {
    console.error('Error during setup:', error);
  }
};

setupDatabase();