const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qujysevuyhqyitxqctxg.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAndSyncIssues() {
  // First, let's see what issues we have
  const { data: issues, error } = await supabase
    .from('issues')
    .select('id, title, type, urgency, status, github_issue_number')
    .in('type', ['feature', 'improvement'])
    .eq('archived', false);

  if (error) {
    console.error('Error fetching issues:', error);
    return;
  }

  console.log('\n=== Current Enhancement Issues ===');
  issues.forEach(issue => {
    console.log(`- ${issue.title} (${issue.type}, ${issue.status}) ${issue.github_issue_number ? `[GitHub #${issue.github_issue_number}]` : '[Not synced]'}`);
  });

  console.log(`\nTotal: ${issues.length} enhancement issues`);
  console.log(`Synced: ${issues.filter(i => i.github_issue_number).length}`);
  console.log(`Not synced: ${issues.filter(i => !i.github_issue_number).length}`);

  // Get an admin user token
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'ksmotomann@gmail.com')
    .single();

  if (adminUser) {
    console.log('\n=== Triggering GitHub Sync ===');
    
    // Create a proper JWT token for the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'ksmotomann@gmail.com'
    });

    console.log('Note: To sync, you need to use the admin UI or run the sync directly from the service.');
  }
}

checkAndSyncIssues().catch(console.error);
