const GoogleReviewCache = require('../models/GoogleReviewCache');
const { fetchAndCacheGoogleReviews } = require('../utils/fetchGoogleReviews');

// GET /api/google-reviews (Public: return cached Google reviews)
const getCachedGoogleReviews = async (req, res) => {
  try {
    // Find all cached reviews
    let cachedReviews = await GoogleReviewCache.find({}).sort({ googleReviewTime: -1 });

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    // Check if cache is empty or stale (older than 24 hours)
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
    const isDbEmpty = cachedReviews.length === 0;
    const isDbStale = !isDbEmpty && (Date.now() - new Date(cachedReviews[0].fetchedAt).getTime() > cacheDuration);

    if ((isDbEmpty || isDbStale) && apiKey && placeId && !apiKey.includes('YOUR_GOOGLE') && !placeId.includes('YOUR_GOOGLE')) {
      // Trigger background update
      fetchAndCacheGoogleReviews().then(async (result) => {
        if (result.success) {
          console.log('[Google Reviews Scheduler] Background cache refresh completed.');
        }
      }).catch(err => {
        console.error('[Google Reviews Scheduler] Background cache refresh failed:', err.message);
      });

      // If db was empty, wait a second to see if we get the data, otherwise return empty
      if (isDbEmpty) {
        // Wait 1.5 seconds for cache insertion
        await new Promise(resolve => setTimeout(resolve, 1500));
        cachedReviews = await GoogleReviewCache.find({}).sort({ googleReviewTime: -1 });
      }
    }

    // Fallback Mock reviews if cache is empty and no API credentials exist
    if (cachedReviews.length === 0) {
      const mockReviews = [
        {
          authorName: "Ali Khan",
          authorPhotoUrl: "",
          rating: 5,
          reviewText: "Outstanding website design and SEO services. They delivered exactly what we needed on time!",
          relativeTimeDescription: "1 week ago",
          googleReviewTime: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
          fetchedAt: new Date()
        },
        {
          authorName: "Sarah Ahmed",
          authorPhotoUrl: "",
          rating: 5,
          reviewText: "Very professional team. Highly recommend them for any web development project.",
          relativeTimeDescription: "3 weeks ago",
          googleReviewTime: Math.floor(Date.now() / 1000) - 21 * 24 * 60 * 60,
          fetchedAt: new Date()
        }
      ];
      return res.json({
        success: true,
        data: mockReviews,
        source: 'Fallback Mock (No API configuration in .env)'
      });
    }

    res.json({
      success: true,
      data: cachedReviews,
      source: 'Database Cache'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /api/google-reviews/refresh (Admin only: manually refresh cache)
const refreshGoogleReviews = async (req, res) => {
  try {
    const result = await fetchAndCacheGoogleReviews();
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCachedGoogleReviews,
  refreshGoogleReviews
};
