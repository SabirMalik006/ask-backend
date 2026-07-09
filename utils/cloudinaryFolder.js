const Work = require('../models/Work');

/**
 * Slugify text by lowercasing, replacing spaces with hyphens, and stripping special characters.
 */
function slugify(text) {
  if (!text) return 'untitled';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

/**
 * Get category slug based on category name.
 */
function getCategorySlug(category) {
  const mapping = {
    'Portfolio': 'portfolio',
    'Web Development': 'web-development',
    'App Development': 'app-development',
    'Digital Marketing': 'digital-marketing',
    'Graphic Designing': 'graphic-designing',
    'E-commerce': 'e-commerce',
    'UI/UX': 'ui-ux',
    'Video Editing': 'video-editing'
  };
  return mapping[category] || 'other';
}

/**
 * Get the full nested path "work/{categorySlug}/{projectSlug}" for Cloudinary.
 * Appends a suffix from the ID if there is a slug collision in the same category.
 */
async function getProjectFolder(category, title, id) {
  const categorySlug = getCategorySlug(category);
  const baseSlug = slugify(title);
  
  if (!id) {
    return `ask-website/work/${categorySlug}/${baseSlug}`;
  }

  try {
    // Fetch other works in the same category to check for slug collisions
    const otherWorks = await Work.find({
      category: category,
      _id: { $ne: id }
    }, 'title client');

    const existingSlugs = otherWorks.map(w => slugify(w.client || w.title));
    const isColliding = existingSlugs.includes(baseSlug);

    const projectSlug = isColliding 
      ? `${baseSlug}-${id.toString().slice(-6)}` 
      : baseSlug;

    return `ask-website/work/${categorySlug}/${projectSlug}`;
  } catch (error) {
    console.error('Error checking slug collision in getProjectFolder:', error);
    // Fallback safely to appending suffix if DB query fails
    return `ask-website/work/${categorySlug}/${baseSlug}-${id.toString().slice(-6)}`;
  }
}

module.exports = {
  getCategorySlug,
  getProjectFolder,
  slugify
};
