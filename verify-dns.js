// Verify DNS records for bealigned.app
const dns = require('dns').promises;

async function verifyDNS() {
  console.log('🔍 Verifying DNS records for bealigned.app\n');
  console.log('================================\n');
  
  const results = {
    mx: false,
    spf: false,
    dkim: false,
    dmarc: false
  };
  
  // Check MX record
  try {
    const mx = await dns.resolveMx('send.bealigned.app');
    console.log('✅ MX Record found:');
    mx.forEach(record => {
      console.log(`   Priority ${record.priority}: ${record.exchange}`);
      if (record.exchange.includes('amazonses.com')) {
        results.mx = true;
      }
    });
  } catch (error) {
    console.log('❌ MX Record: Not found or not propagated yet');
  }
  
  console.log();
  
  // Check SPF (TXT record)
  try {
    const txt = await dns.resolveTxt('send.bealigned.app');
    console.log('📝 TXT Records found:');
    txt.forEach(record => {
      const value = record.join('');
      console.log(`   ${value}`);
      if (value.includes('v=spf1') && value.includes('amazonses.com')) {
        console.log('   ✅ SPF record verified');
        results.spf = true;
      }
    });
  } catch (error) {
    console.log('❌ SPF Record: Not found or not propagated yet');
  }
  
  console.log();
  
  // Check DKIM
  try {
    const dkim = await dns.resolveTxt('resend._domainkey.bealigned.app');
    console.log('🔐 DKIM Record found:');
    dkim.forEach(record => {
      const value = record.join('');
      if (value.startsWith('p=')) {
        console.log('   ✅ DKIM public key present');
        console.log(`   Key: ${value.substring(0, 50)}...`);
        results.dkim = true;
      }
    });
  } catch (error) {
    console.log('❌ DKIM Record: Not found or not propagated yet');
  }
  
  console.log();
  
  // Check DMARC
  try {
    const dmarc = await dns.resolveTxt('_dmarc.bealigned.app');
    console.log('🛡️ DMARC Record found:');
    dmarc.forEach(record => {
      const value = record.join('');
      console.log(`   ${value}`);
      if (value.includes('v=DMARC1')) {
        console.log('   ✅ DMARC policy configured');
        results.dmarc = true;
      }
    });
  } catch (error) {
    console.log('❌ DMARC Record: Not found or not propagated yet');
  }
  
  console.log('\n================================');
  console.log('📊 VERIFICATION SUMMARY\n');
  
  const allVerified = Object.values(results).every(v => v === true);
  
  if (allVerified) {
    console.log('🎉 All DNS records are properly configured!');
    console.log('✅ Your domain is ready to send emails');
    console.log('\nEmails will be sent from: noreply@send.bealigned.app');
  } else {
    console.log('⏳ Some records are still propagating...\n');
    console.log('Status:');
    console.log(`  MX Record: ${results.mx ? '✅' : '⏳ Pending'}`);
    console.log(`  SPF Record: ${results.spf ? '✅' : '⏳ Pending'}`);
    console.log(`  DKIM Record: ${results.dkim ? '✅' : '⏳ Pending'}`);
    console.log(`  DMARC Record: ${results.dmarc ? '✅' : '⏳ Pending'}`);
    console.log('\n💡 DNS propagation can take 5-30 minutes');
    console.log('   Run this script again in a few minutes');
  }
  
  console.log('\n================================');
  console.log('🧪 TEST EMAIL SENDING\n');
  
  if (results.mx && results.spf) {
    console.log('Basic email sending should work now!');
    console.log('Test by completing a conversation and requesting email transcript.');
  } else {
    console.log('Wait for MX and SPF records to propagate before testing.');
  }
}

verifyDNS().catch(console.error);