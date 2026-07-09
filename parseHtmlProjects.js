const fs = require('fs');
const path = require('path');

const files = [
  { path: '../new-ask-frontend/web-project-details.html', category: 'Web Development' },
  { path: '../new-ask-frontend/App-project-details.html', category: 'App Development' },
  { path: '../new-ask-frontend/graphic-project-details.html', category: 'Graphic Designing' },
  { path: '../new-ask-frontend/uiux-project-detail.html', category: 'UI/UX' }
];

const projects = [];

files.forEach(f => {
  const filePath = path.resolve(__dirname, f.path);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split content by `<div class="mxd-data-list">` to segment projects
  const blocks = content.split(/<div class="mxd-data-list">/gi);
  console.log(`File: ${f.path} - Found ${blocks.length - 1} data blocks.`);
  
  // The first block is header content, skip it.
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Extract client
    const clientMatch = block.match(/<p class="mxd-data-list__name">Client<\/p>\s*<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i) ||
                        block.match(/Client<\/p>\s*<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i) ||
                        block.match(/Client[\s\S]*?<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i);
    const client = clientMatch ? clientMatch[1].trim() : '';
    
    if (!client) {
      // Let's try matching any layout that has Client in it
      const fallbackClientMatch = block.match(/<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i);
      if (fallbackClientMatch && !fallbackClientMatch[0].includes('Services') && !fallbackClientMatch[0].includes('Industries')) {
        // console.log(`Fallback Client: ${fallbackClientMatch[1].trim()}`);
      }
      continue;
    }
    
    // Extract services
    const servicesMatch = block.match(/Services<\/p>\s*<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i) ||
                          block.match(/Service<\/p>\s*<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i) ||
                          block.match(/Services[\s\S]*?<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i);
    const services = servicesMatch ? servicesMatch[1].trim() : '';
    
    // Extract industries
    const industriesMatch = block.match(/Industries<\/p>\s*<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i) ||
                            block.match(/Industry<\/p>\s*<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i) ||
                            block.match(/Industries[\s\S]*?<p class="mxd-data-list__content">([\s\S]*?)<\/p>/i);
    const industries = industriesMatch ? industriesMatch[1].trim() : '';
    
    // Extract viewMore URL and Label
    const viewMoreMatch = block.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const viewMoreUrl = viewMoreMatch ? viewMoreMatch[1].trim() : '';
    let viewMoreLabel = '';
    if (viewMoreMatch) {
      viewMoreLabel = viewMoreMatch[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // Extract tags (find tags in block segment)
    const tags = [];
    const tagMatches = block.matchAll(/<span class="tag[^>]*>([\s\S]*?)<\/span>/gi);
    for (const tm of tagMatches) {
      tags.push(tm[1].replace(/<[^>]+>/g, '').trim());
    }
    
    // Extract images (find images in this block segment)
    const images = [];
    const imgMatches = block.matchAll(/src="(\.\/img\/[^"]+)"|src="(img\/[^"]+)"/gi);
    for (const im of imgMatches) {
      const src = (im[1] || im[2]).trim();
      // Skip logo and avatars
      if (!src.includes('logo') && !src.includes('avatar') && !src.includes('WhatsApp')) {
        images.push(src);
      }
    }
    
    // If no images found, look for any image tags in the block
    if (images.length === 0) {
      const fallbackImgs = block.matchAll(/src="([^"]+)"/gi);
      for (const fim of fallbackImgs) {
        const src = fim[1].trim();
        if (src.includes('img/') && !src.includes('logo') && !src.includes('WhatsApp')) {
          images.push(src);
        }
      }
    }

    // Clean client string from HTML
    const cleanClient = client.replace(/<[^>]+>/g, '').trim();

    projects.push({
      category: f.category,
      client: cleanClient,
      services: services.replace(/<[^>]+>/g, '').trim(),
      industries: industries.replace(/<[^>]+>/g, '').trim(),
      viewMoreUrl,
      viewMoreLabel,
      tags,
      images,
      title: `${cleanClient} - ${services.replace(/<[^>]+>/g, '').trim() || f.category}`
    });
  }
});

console.log(`\n--- PARSING SUMMARY ---`);
console.log(`Total parsed projects: ${projects.length}`);
console.log(JSON.stringify(projects.slice(0, 5), null, 2));

// Save to JSON for verification
fs.writeFileSync(path.resolve(__dirname, 'parsed_projects.json'), JSON.stringify(projects, null, 2));
console.log(`Saved parsed projects details to ask-backend/parsed_projects.json`);
