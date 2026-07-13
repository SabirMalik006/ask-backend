const GoogleReviewCache = require('../models/GoogleReviewCache');

/**
 * Fetches reviews from Google Places API and upserts them in GoogleReviewCache.
 * Handles the platform limit of up to 5 reviews gracefully.
 */
const fetchAndCacheGoogleReviews = async () => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Check if credentials are correct / not placeholders
  if (!apiKey || !placeId || apiKey.includes('YOUR_GOOGLE') || placeId.includes('YOUR_GOOGLE')) {
    console.warn('[Google Places API] API Key or Place ID is missing or contains placeholder values. Skipping Google reviews fetch.');
    return {
      success: false,
      message: 'API Key or Place ID contains placeholder values. Configure them in .env.'
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      const reviews = (data.result && data.result.reviews) ? data.result.reviews : [];
      
      console.log(`[Google Places API] Fetched ${reviews.length} reviews from Google.`);

      let upsertCount = 0;
      for (const rev of reviews) {
        if (!rev.author_name || rev.rating === undefined) continue;

        // Upsert review (update if matching authorName + googleReviewTime, otherwise create new)
        await GoogleReviewCache.findOneAndUpdate(
          { 
            authorName: rev.author_name, 
            googleReviewTime: rev.time 
          },
          {
            authorName: rev.author_name,
            authorPhotoUrl: rev.profile_photo_url || '',
            rating: rev.rating,
            reviewText: rev.text || '',
            relativeTimeDescription: rev.relative_time_description || '',
            googleReviewTime: rev.time,
            fetchedAt: new Date()
          },
          { upsert: true, new: true }
        );
        upsertCount++;
      }

      return {
        success: true,
        message: `Successfully fetched and cached ${upsertCount} Google reviews.`,
        count: upsertCount
      };
    } else {
      const errMsg = data.error_message || 'Unknown status returned';
      console.error(`[Google Places API Error] Status: ${data.status} - ${errMsg}`);
      return {
        success: false,
        message: `Google API error: ${data.status} - ${errMsg}`
      };
    }
  } catch (error) {
    console.error('[Google Places API Error] Exception during fetch:', error.message);
    return {
      success: false,
      message: `Exception during fetch: ${error.message}`
    };
  }
};

module.exports = {
  fetchAndCacheGoogleReviews
};
