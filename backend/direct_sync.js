// Direct sync using the GitHub service
require('dotenv').config();
const { githubSyncService } = require('./dist/services/githubSync.js');

async function performSync() {
  console.log('Starting GitHub sync...');
  
  try {
    const results = await githubSyncService.syncEnhancementsToGitHub();
    console.log('\n=== Sync Results ===');
    console.log(`Successfully synced: ${results.synced} issues`);
    
    if (results.errors && results.errors.length > 0) {
      console.log('\nErrors encountered:');
      results.errors.forEach(err => console.log(`- ${err}`));
    }
    
    console.log('\n✅ Sync complete!');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

performSync();
