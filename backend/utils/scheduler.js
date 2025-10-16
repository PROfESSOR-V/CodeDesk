import cron from 'node-cron';
import { supabase } from '../config/supabaseClient.js';
import CodeChefScraper from './codechefProfileScraper.js';

export const startDailyRefresh = () => {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Starting daily profile refresh...');
    await refreshAllProfiles();
  });
  
  console.log('📅 Daily refresh scheduler started (2 AM daily)');
};

const refreshAllProfiles = async () => {
  const scraper = new CodeChefScraper();
  
  try {
    // Get all profiles older than 24 hours
    const { data: profiles, error } = await supabase
      .from('codechef_profiles')
      .select('username, last_scraped_at')
      .lt('last_scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    console.log(`🔄 Found ${profiles.length} profiles to refresh`);
    
    await scraper.initializeBrowser();
    
    for (const profile of profiles) {
      try {
        console.log(`🔄 Refreshing ${profile.username}...`);
        await scraper.scrapeProfile(profile.username);
        console.log(`✅ ${profile.username} refreshed`);
        
        // Wait 5 seconds between profiles to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`❌ Failed to refresh ${profile.username}:`, error.message);
      }
    }
    
    console.log('✅ Daily refresh completed');
    
  } catch (error) {
    console.error('❌ Daily refresh failed:', error);
  } finally {
    await scraper.cleanup();
  }
};