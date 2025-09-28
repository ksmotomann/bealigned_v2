const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSessionData() {
  console.log('📊 Session Tracking Status\n');
  console.log('===========================\n');
  
  try {
    // Check user_sessions table
    const { data: sessions, error: sessionsError, count: sessionCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact' })
      .order('login_at', { ascending: false })
      .limit(5);
    
    if (sessionsError) {
      console.log('❌ Error fetching sessions:', sessionsError.message);
    } else {
      console.log(`✅ User Sessions Table: ${sessionCount || 0} total sessions`);
      
      if (sessions && sessions.length > 0) {
        console.log('\n📝 Recent Sessions:');
        sessions.forEach((session, index) => {
          console.log(`\n  Session ${index + 1}:`);
          console.log(`    User ID: ${session.user_id}`);
          console.log(`    IP: ${session.ip_address}`);
          console.log(`    Login: ${new Date(session.login_at).toLocaleString()}`);
          console.log(`    Active: ${session.is_active ? 'Yes' : 'No'}`);
          if (session.logout_at) {
            console.log(`    Logout: ${new Date(session.logout_at).toLocaleString()}`);
          }
        });
      } else {
        console.log('   No sessions recorded yet');
      }
    }
    
    // Check login_attempts table
    const { data: attempts, error: attemptsError, count: attemptCount } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .order('attempted_at', { ascending: false })
      .limit(5);
    
    if (attemptsError) {
      console.log('\n❌ Error fetching login attempts:', attemptsError.message);
    } else {
      console.log(`\n✅ Login Attempts Table: ${attemptCount || 0} total attempts`);
      
      if (attempts && attempts.length > 0) {
        console.log('\n📝 Recent Login Attempts:');
        attempts.forEach((attempt, index) => {
          console.log(`\n  Attempt ${index + 1}:`);
          console.log(`    Email: ${attempt.email}`);
          console.log(`    Success: ${attempt.success ? 'Yes' : 'No'}`);
          console.log(`    IP: ${attempt.ip_address}`);
          console.log(`    Time: ${new Date(attempt.attempted_at).toLocaleString()}`);
          if (attempt.failure_reason) {
            console.log(`    Reason: ${attempt.failure_reason}`);
          }
        });
      } else {
        console.log('   No login attempts recorded yet');
      }
    }
    
    // Get statistics
    const { count: activeCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    console.log('\n📈 Statistics:');
    console.log(`   Active Sessions: ${activeCount || 0}`);
    console.log(`   Total Sessions: ${sessionCount || 0}`);
    console.log(`   Total Login Attempts: ${attemptCount || 0}`);
    
    console.log('\n✨ Session tracking is configured and ready!');
    console.log('\n💡 To test session tracking:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Register a new user or login');
    console.log('3. Run this script again to see the tracked sessions');
    
  } catch (error) {
    console.error('Error checking session data:', error);
  }
}

checkSessionData();