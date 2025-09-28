import dotenv from 'dotenv';
import { githubSyncService } from '../services/githubSync';

dotenv.config();

async function syncToGitHub() {
  console.log('🚀 Starting GitHub sync...');
  console.log(`Repository: ${process.env.GITHUB_REPO_URL}`);
  
  try {
    const results = await githubSyncService.syncEnhancementsToGitHub();
    
    console.log('\n✅ Sync Complete!');
    console.log('=====================================');
    console.log(`✓ Successfully synced: ${results.synced} issues`);
    
    if (results.errors && results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\n📊 Next steps:');
    console.log('1. Check your GitHub repository: https://github.com/ksmotomann/bealigned/issues');
    console.log('2. Configure webhooks for automatic sync (see instructions below)');
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
  
  process.exit(0);
}

syncToGitHub();