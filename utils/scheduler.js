const cron = require('node-cron');
const { fetchAndCacheGoogleReviews } = require('./fetchGoogleReviews');

const initScheduler = () => {
  // Run once daily at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('[Google Reviews Cron] Starting daily Google reviews cache refresh...');
    try {
      const result = await fetchAndCacheGoogleReviews();
      if (result.success) {
        console.log(`[Google Reviews Cron] Cache refresh successful. Updated count: ${result.count}`);
      } else {
        console.warn(`[Google Reviews Cron] Cache refresh skipped or failed: ${result.message}`);
      }
    } catch (error) {
      console.error('[Google Reviews Cron Error] Exception during scheduled fetch:', error.message);
    }
  });
  console.log('[Scheduler] Daily Google Reviews cron job initialized.');
};

module.exports = {
  initScheduler
};
