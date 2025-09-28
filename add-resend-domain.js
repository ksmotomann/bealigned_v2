// Add domain to Resend and get DNS records
const RESEND_API_KEY = 're_PrFWVAL8_EqvNqj4g9Y34tUXE9RmYZnmt';

async function addDomain() {
  try {
    console.log('📧 Adding bealigned.app to Resend...\n');
    
    // Add the domain
    const response = await fetch('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'bealigned.app',
        region: 'us-east-1' // You can change to 'eu-west-1' if you prefer EU
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error);
      
      // If domain already exists, get its details
      if (data.error.includes('already exists')) {
        console.log('\nDomain already added! Getting current DNS records...\n');
        
        const domainsResponse = await fetch('https://api.resend.com/domains', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const domains = await domainsResponse.json();
        const bealignedDomain = domains.data?.find(d => d.name === 'bealigned.app');
        
        if (bealignedDomain) {
          displayDNSRecords(bealignedDomain);
        }
      }
      return;
    }
    
    if (data.id) {
      console.log('✅ Domain added successfully!\n');
      displayDNSRecords(data);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayDNSRecords(domain) {
  console.log('================================');
  console.log('📋 DNS RECORDS TO ADD');
  console.log('================================\n');
  console.log(`Domain: ${domain.name}`);
  console.log(`Status: ${domain.status}`);
  console.log(`Region: ${domain.region}\n`);
  
  if (!domain.records || domain.records.length === 0) {
    // Provide standard Resend DNS records
    console.log('Add these DNS records to your domain provider:\n');
    
    console.log('1️⃣ MX RECORD (for receiving bounces):');
    console.log('   Type: MX');
    console.log('   Name: (leave blank or @)');
    console.log('   Value: feedback-smtp.us-east-1.amazonses.com');
    console.log('   Priority: 10');
    console.log('   TTL: 3600\n');
    
    console.log('2️⃣ SPF RECORD (for authentication):');
    console.log('   Type: TXT');
    console.log('   Name: (leave blank or @)');
    console.log('   Value: "v=spf1 include:amazonses.com ~all"');
    console.log('   TTL: 3600\n');
    
    console.log('3️⃣ DKIM RECORDS (for email signing):');
    console.log('   You\'ll receive 3 CNAME records via email or in Resend dashboard');
    console.log('   They look like: resend._domainkey.bealigned.app\n');
    
  } else {
    console.log('Add these DNS records to your domain provider:\n');
    
    const recordTypes = {
      'MX': '1️⃣',
      'TXT': '2️⃣',
      'CNAME': '3️⃣'
    };
    
    domain.records.forEach((record, index) => {
      const emoji = recordTypes[record.record] || '📌';
      console.log(`${emoji} ${record.record} RECORD:`);
      console.log(`   Type: ${record.record}`);
      console.log(`   Name: ${record.name || '(root/blank/@)'}`);
      console.log(`   Value: ${record.value}`);
      if (record.priority) {
        console.log(`   Priority: ${record.priority}`);
      }
      console.log(`   TTL: ${record.ttl || '3600'}`);
      console.log(`   Status: ${record.status === 'verified' ? '✅ Verified' : '⏳ Pending'}\n`);
    });
  }
  
  console.log('================================');
  console.log('🔧 WHERE TO ADD THESE RECORDS:');
  console.log('================================\n');
  console.log('Common providers:');
  console.log('• Cloudflare: DNS → Records → Add Record');
  console.log('• Namecheap: Domain List → Manage → Advanced DNS');
  console.log('• GoDaddy: My Products → DNS → Manage Zones');
  console.log('• Google Domains: DNS → Manage Custom Records\n');
  
  console.log('⏱️  After adding records:');
  console.log('• SPF/TXT: Verifies in 5-10 minutes');
  console.log('• MX: Verifies in 10-30 minutes');
  console.log('• DKIM/CNAME: Can take up to 48 hours\n');
  
  console.log('✅ Once verified, your emails will be sent from:');
  console.log('   noreply@bealigned.app');
}

addDomain();