// Test Resend domain configuration
const RESEND_API_KEY = 're_PrFWVAL8_EqvNqj4g9Y34tUXE9RmYZnmt';

async function checkResendDomains() {
  try {
    // Get all domains
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('📧 Resend Domain Status:\n');
    console.log('================================');
    
    if (data.data && data.data.length > 0) {
      data.data.forEach(domain => {
        console.log(`\nDomain: ${domain.name}`);
        console.log(`Status: ${domain.status}`);
        console.log(`Created: ${domain.created_at}`);
        console.log(`Region: ${domain.region}`);
        
        if (domain.records) {
          console.log('\nDNS Records to configure:');
          domain.records.forEach(record => {
            console.log(`  ${record.record}: ${record.name} -> ${record.value}`);
            console.log(`  Priority: ${record.priority || 'N/A'}`);
            console.log(`  Status: ${record.status}\n`);
          });
        }
      });
    } else {
      console.log('No domains configured yet.');
      console.log('\nTo add a domain:');
      console.log('1. Go to https://resend.com/domains');
      console.log('2. Click "Add Domain"');
      console.log('3. Enter your domain (e.g., bealigned.com)');
      console.log('4. Add the DNS records shown to your domain provider');
    }
    
    // Test sending capability
    console.log('\n================================');
    console.log('Testing email send capability...\n');
    
    const testEmail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Test domain
        to: ['delivered@resend.dev'], // Test recipient
        subject: 'Test Email',
        html: '<p>Testing Resend configuration</p>'
      })
    });
    
    const testResult = await testEmail.json();
    
    if (testResult.id) {
      console.log('✅ Email sending works!');
      console.log(`Email ID: ${testResult.id}`);
      console.log('\nYou can send emails using:');
      console.log('- onboarding@resend.dev (test domain)');
      if (data.data && data.data.length > 0) {
        data.data.forEach(domain => {
          if (domain.status === 'verified') {
            console.log(`- noreply@${domain.name} (your verified domain)`);
          }
        });
      }
    } else {
      console.log('❌ Email sending failed:');
      console.log(testResult);
    }
    
  } catch (error) {
    console.error('Error checking Resend configuration:', error);
  }
}

checkResendDomains();