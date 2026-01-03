/**
 * Script to generate static HTML pages with OpenGraph metadata
 *
 * Usage:
 *   1. Start your NestJS app: npm run start:dev
 *   2. Run this script: node scripts/generate-static-pages.js
 *
 * This will create HTML files in the public/ directory for each post with OpenGraph metadata
 */

const fs = require('fs');
const path = require('path');

// You can use fetch in Node.js 18+, or install node-fetch for earlier versions
const GRAPHQL_ENDPOINT = 'http://localhost:3000/graphql';

const query = `
  query GetAllPostsWithOG {
    posts {
      id
      title
      content
      published
      author {
        name
        email
      }
      categories {
        name
      }
      openGraphMetadata {
        id
        title
        description
        type
        url
        image
        imageAlt
        imageWidth
        imageHeight
        author
        publisher
        publishedTime
        tags
        locale
        siteName
        twitterCard
        twitterSite
        twitterCreator
        videoUrl
        videoDuration
        price
        currency
        availability
        eventStartTime
        eventEndTime
        locationAddress
        locationLatitude
        locationLongitude
      }
    }
  }
`;

async function fetchPosts() {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.posts;
}

function generateOpenGraphTags(og) {
  if (!og) return '';

  let tags = `
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${escapeHtml(og.title)}">
  <meta property="og:description" content="${escapeHtml(og.description)}">
  <meta property="og:type" content="${og.type}">`;

  if (og.url) tags += `\n  <meta property="og:url" content="${og.url}">`;
  if (og.image) {
    tags += `\n  <meta property="og:image" content="${og.image}">`;
    if (og.imageAlt) tags += `\n  <meta property="og:image:alt" content="${escapeHtml(og.imageAlt)}">`;
    if (og.imageWidth) tags += `\n  <meta property="og:image:width" content="${og.imageWidth}">`;
    if (og.imageHeight) tags += `\n  <meta property="og:image:height" content="${og.imageHeight}">`;
  }
  if (og.locale) tags += `\n  <meta property="og:locale" content="${og.locale}">`;
  if (og.siteName) tags += `\n  <meta property="og:site_name" content="${escapeHtml(og.siteName)}">`;

  // Article-specific tags
  if (og.type === 'article') {
    if (og.author) tags += `\n  <meta property="article:author" content="${escapeHtml(og.author)}">`;
    if (og.publisher) tags += `\n  <meta property="article:publisher" content="${escapeHtml(og.publisher)}">`;
    if (og.publishedTime) tags += `\n  <meta property="article:published_time" content="${og.publishedTime}">`;
    if (og.tags && og.tags.length > 0) {
      og.tags.forEach((tag) => {
        tags += `\n  <meta property="article:tag" content="${escapeHtml(tag)}">`;
      });
    }
  }

  // Product-specific tags
  if (og.type === 'product') {
    if (og.price) tags += `\n  <meta property="product:price:amount" content="${og.price}">`;
    if (og.currency) tags += `\n  <meta property="product:price:currency" content="${og.currency}">`;
    if (og.availability) tags += `\n  <meta property="product:availability" content="${og.availability}">`;
  }

  // Video-specific tags
  if (og.type === 'video.movie' || og.videoUrl) {
    if (og.videoUrl) {
      tags += `\n  <meta property="og:video" content="${og.videoUrl}">`;
      if (og.videoDuration) tags += `\n  <meta property="video:duration" content="${og.videoDuration}">`;
    }
  }

  // Twitter Card tags
  if (og.twitterCard) {
    tags += `\n\n  <!-- Twitter Card Meta Tags -->`;
    tags += `\n  <meta name="twitter:card" content="${og.twitterCard}">`;
    if (og.twitterSite) tags += `\n  <meta name="twitter:site" content="${og.twitterSite}">`;
    if (og.twitterCreator) tags += `\n  <meta name="twitter:creator" content="${og.twitterCreator}">`;
    tags += `\n  <meta name="twitter:title" content="${escapeHtml(og.title)}">`;
    tags += `\n  <meta name="twitter:description" content="${escapeHtml(og.description)}">`;
    if (og.image) {
      tags += `\n  <meta name="twitter:image" content="${og.image}">`;
      if (og.imageAlt) tags += `\n  <meta name="twitter:image:alt" content="${escapeHtml(og.imageAlt)}">`;
    }
  }

  return tags;
}

function generateShareButtons(og) {
  if (!og || !og.url) return '';

  const encodedUrl = encodeURIComponent(og.url);

  let twitterParams = `url=${encodedUrl}`;
  if (og.title) twitterParams += `&text=${encodeURIComponent(og.title)}`;
  if (og.twitterSite) twitterParams += `&via=${og.twitterSite.replace('@', '')}`;
  if (og.tags && og.tags.length > 0) {
    const hashtags = og.tags.slice(0, 2).join(',');
    twitterParams += `&hashtags=${encodeURIComponent(hashtags)}`;
  }

  return `
  <div class="share-buttons">
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"
       class="share-btn facebook"
       target="_blank"
       rel="noopener">
      Share on Facebook
    </a>
    <a href="https://twitter.com/intent/tweet?${twitterParams}"
       class="share-btn twitter"
       target="_blank"
       rel="noopener">
      Share on Twitter
    </a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}"
       class="share-btn linkedin"
       target="_blank"
       rel="noopener">
      Share on LinkedIn
    </a>
  </div>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHTML(post) {
  const og = post.openGraphMetadata;
  const title = og?.title || post.title;
  const description = og?.description || post.content.substring(0, 200);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
${generateOpenGraphTags(og)}

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .share-buttons {
      margin: 30px 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .share-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      color: white;
      display: inline-block;
    }
    .facebook { background-color: #1877f2; }
    .twitter { background-color: #1da1f2; }
    .linkedin { background-color: #0a66c2; }
    .share-btn:hover {
      opacity: 0.9;
    }
    .content {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
      white-space: pre-wrap;
    }
    .meta-info {
      background: #e9ecef;
      padding: 15px;
      border-radius: 5px;
      font-size: 14px;
      margin: 20px 0;
    }
    .meta-info strong {
      color: #495057;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: #6c757d;
      color: white;
      border-radius: 3px;
      font-size: 12px;
      margin-right: 5px;
    }
    .preview-image {
      width: 100%;
      max-width: 600px;
      height: auto;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(post.title)}</h1>

  <div class="meta-info">
    <strong>Author:</strong> ${escapeHtml(post.author.name)}<br>
    ${og?.publishedTime ? `<strong>Published:</strong> ${new Date(og.publishedTime).toLocaleDateString()}<br>` : ''}
    ${post.categories.length > 0 ? `<strong>Categories:</strong> ${post.categories.map((c) => `<span class="badge">${escapeHtml(c.name)}</span>`).join(' ')}<br>` : ''}
    ${og?.tags && og.tags.length > 0 ? `<strong>Tags:</strong> ${og.tags.map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join(' ')}` : ''}
  </div>

  ${og?.image ? `<img src="${og.image}" alt="${escapeHtml(og.imageAlt || post.title)}" class="preview-image">` : ''}

  ${generateShareButtons(og)}

  <div class="content">${escapeHtml(post.content)}</div>

  <h2>Testing Instructions</h2>
  <ol>
    <li><strong>Make public:</strong> <code>ngrok http 8080</code></li>
    <li><strong>Test share preview:</strong> Use Facebook Debugger, Twitter Validator, or LinkedIn Inspector</li>
  </ol>

  <div style="margin-top: 40px; padding: 20px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
    <strong>Note:</strong> Social media platforms need to be able to access this page publicly to read the OpenGraph metadata.
    Use ngrok or deploy to a hosting service to test the rich preview cards.
  </div>
</body>
</html>`;
}

async function generateStaticPages() {
  try {
    console.log('Fetching posts from GraphQL API...');
    const posts = await fetchPosts();
    console.log(`Found ${posts.length} posts`);

    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const postsDir = path.join(publicDir, 'posts');
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    let generatedCount = 0;
    for (const post of posts) {
      if (!post.openGraphMetadata) {
        console.log(`Skipping post ${post.id}: No OpenGraph metadata`);
        continue;
      }

      const filename = `post-${post.id}.html`;
      const filepath = path.join(postsDir, filename);
      const html = generateHTML(post);

      fs.writeFileSync(filepath, html, 'utf-8');
      console.log(`✓ Generated: ${filename}`);
      generatedCount++;
    }

    console.log(`\n✅ Successfully generated ${generatedCount} static pages in public/posts/`);
  } catch (error) {
    console.error('❌ Error generating pages:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your NestJS app is running: npm run start:dev');
    console.error('2. GraphQL endpoint is accessible at http://localhost:3000/graphql');
    process.exit(1);
  }
}

generateStaticPages();
