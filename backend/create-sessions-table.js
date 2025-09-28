const https = require('https');

const accessToken = 'sbp_619266f54f3a610a70db8c91fa07bc95c392e6b1';
const projectRef = 'qujysevuyhqyitxqctxg';

const sqlCommands = [
  // Create user_sessions table
  `CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    logout_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    is_active BOOLEAN DEFAULT true,
    login_method TEXT, -- 'password', 'google', 'github', etc.
    device_info JSONB,
    location_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  )`,
  
  // Create login_attempts table for failed logins
  `CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  )`,
  
  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON public.user_sessions(login_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email)`,
  `CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address)`,
  
  // Enable RLS
  `ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY`,
  
  // Create RLS policies for user_sessions
  `CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id)`,
    
  `CREATE POLICY "System can insert sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (true)`,
    
  `CREATE POLICY "System can update sessions" ON public.user_sessions
    FOR UPDATE USING (true)`,
    
  `CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
      )
    )`,
  
  // Create RLS policies for login_attempts
  `CREATE POLICY "Admins can view login attempts" ON public.login_attempts
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
      )
    )`,
    
  `CREATE POLICY "System can insert login attempts" ON public.login_attempts
    FOR INSERT WITH CHECK (true)`
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

async function createSessionTables() {
  console.log('📊 Creating session tracking tables...\n');
  
  for (const sql of sqlCommands) {
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
  
  console.log('\n✨ Session tracking tables created!');
  console.log('\nSession tracking will monitor:');
  console.log('- Login/logout times');
  console.log('- IP addresses');
  console.log('- User agents/devices');
  console.log('- Active sessions');
  console.log('- Failed login attempts');
}

createSessionTables();