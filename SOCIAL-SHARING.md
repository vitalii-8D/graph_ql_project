# Social Sharing & Open Graph Protocol Documentation

## Overview

This project implements comprehensive social sharing functionality using the Open Graph Protocol (OGP). The implementation enables rich media sharing across Facebook, Twitter, LinkedIn, and other social media platforms.

## Features

### Open Graph Protocol Implementation

- ✅ Complete OGP metadata support
- ✅ Article, product, video, event, and recipe content types
- ✅ Rich media metadata (images, videos, audio)
- ✅ Location data support
- ✅ Product pricing and availability
- ✅ Event date and time information
- ✅ Twitter Card integration
- ✅ Multi-language support

### Social Media Platform Support

- ✅ **Facebook** - Share dialog with rich previews
- ✅ **Twitter** - Tweet composer with cards
- ✅ **LinkedIn** - Professional network sharing

## Architecture

### Entities

#### OpenGraphMetadata Entity

Stores all Open Graph Protocol metadata for posts:

```typescript
- title: string                    // OG title
- description: string              // OG description
- type: OgType                     // Content type (article, product, video, etc.)
- url: string                      // Canonical URL
- image: string                    // Preview image URL
- imageAlt: string                 // Image description
- imageWidth/Height: number        // Image dimensions
- author: string                   // Content author
- publisher: string                // Content publisher
- publishedTime: Date              // Publication date
- modifiedTime: Date               // Last modified date
- tags: string[]                   // Content tags/keywords
- videoUrl: string                 // Video content URL
- videoDuration: number            // Video length in seconds
- audioUrl: string                 // Audio content URL
- price/currency: number/string    // Product pricing
- availability: string             // Product stock status
- eventStartTime/EndTime: Date     // Event timing
- locationAddress: string          // Physical address
- locationLatitude/Longitude: number // GPS coordinates
- locale: string                   // Language/region
- siteName: string                 // Website name
- twitterCard: string              // Twitter card type
- twitterSite/Creator: string      // Twitter handles
```

### Services

#### SocialSharingService

Generates share links and Open Graph HTML tags:

**Methods:**

- `generateShareLinks(url, metadata?)` - Creates share links for all platforms
- `generateFacebookShareLink(url)` - Facebook share dialog URL
- `generateTwitterShareLink(url, metadata?)` - Twitter tweet composer URL
- `generateLinkedInShareLink(url)` - LinkedIn share URL
- `generateOpenGraphTags(metadata, baseUrl)` - HTML meta tags for `<head>`

#### OpenGraphService

Manages OpenGraph metadata CRUD operations:

**Methods:**

- `create(postId, createOpenGraphInput)` - Add OG metadata to post
- `findAll()` - Get all OG metadata records
- `findOne(id)` - Get specific OG metadata
- `findByPostId(postId)` - Get OG metadata for a post
- `update(updateOpenGraphInput)` - Update OG metadata
- `remove(id)` - Delete OG metadata

## Usage Guide

### 1. Create OpenGraph Metadata

```graphql
mutation {
  createOpenGraphMetadata(
    postId: 1
    createOpenGraphInput: {
      title: "Amazing Blog Post"
      description: "Learn about GraphQL and NestJS"
      type: article
      url: "https://example.com/posts/amazing-post"
      image: "https://example.com/images/preview.jpg"
      imageAlt: "GraphQL tutorial preview"
      imageWidth: 1200
      imageHeight: 630
      author: "John Doe"
      publisher: "Tech Blog"
      tags: ["GraphQL", "NestJS"]
      locale: "en_US"
      siteName: "My Tech Blog"
      twitterCard: "summary_large_image"
      twitterSite: "@mytechblog"
    }
  ) {
    id
    title
    url
  }
}
```

### 2. Generate Share Links

```graphql
query {
  generateShareLinks(url: "https://example.com/posts/amazing-post", postId: 1) {
    facebook
    twitter
    linkedin
  }
}
```

**Response:**

```json
{
  "facebook": "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fposts%2Famazing-post",
  "twitter": "https://twitter.com/intent/tweet?url=https%3A%2F%2Fexample.com%2Fposts%2Famazing-post&text=Amazing+Blog+Post&via=mytechblog&hashtags=GraphQL%2CNestJS",
  "linkedin": "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Fposts%2Famazing-post"
}
```

### 3. Generate HTML Meta Tags

```graphql
query {
  generateOpenGraphTags(id: 1, baseUrl: "https://example.com")
}
```

**Response:** (HTML string to insert in `<head>`)

```html
<meta property="og:title" content="Amazing Blog Post" />
<meta property="og:description" content="Learn about GraphQL and NestJS" />
<meta property="og:type" content="article" />
<meta property="og:url" content="https://example.com/posts/amazing-post" />
<meta property="og:image" content="https://example.com/images/preview.jpg" />
<meta property="og:image:alt" content="GraphQL tutorial preview" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
... (and more)
```

## Content Types

### Article (Blog Posts, News)

```graphql
type: article
Required: title, description, url
Optional: author, publisher, publishedTime, modifiedTime, tags
```

### Product (E-commerce)

```graphql
type: product
Required: title, description, image
Optional: price, currency, availability
```

### Video

```graphql
type: video_movie
Required: title, description, videoUrl
Optional: videoDuration, videoWidth, videoHeight
```

### Event

```graphql
type: event
Required: title, description
Optional: eventStartTime, eventEndTime, locationAddress, coordinates
```

## Best Practices

### Image Requirements

- **Minimum Size**: 1200×630 pixels
- **Aspect Ratio**: 1.91:1 recommended
- **File Size**: < 8MB
- **Format**: JPG or PNG
- **Always provide**: imageAlt for accessibility

### Title & Description

- **Title**: 60-90 characters (optimal: 60)
- **Description**: 155-200 characters (optimal: 155)
- **Be specific** and descriptive
- **Include keywords** naturally
- **Match page content** accurately

### URLs

- Use **canonical URLs** (permanent, not campaign URLs)
- Use **HTTPS** whenever possible
- Avoid **URL parameters** when possible
- Keep URLs **short and readable**

### Twitter Cards

Card Types:

- `summary` - Small square image
- `summary_large_image` - Large banner image (recommended)
- `player` - Video/audio player
- `app` - Mobile app promotion

### Testing

Before going live, test your OpenGraph metadata:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/

## Examples

### Blog Article

```graphql
mutation {
  createOpenGraphMetadata(
    postId: 1
    createOpenGraphInput: {
      title: "10 Tips for Remote Work Success"
      description: "Boost your productivity with these proven remote work strategies"
      type: article
      url: "https://blog.example.com/remote-work-tips"
      image: "https://blog.example.com/images/remote-work.jpg"
      author: "Jane Smith"
      publisher: "Remote Work Blog"
      publishedTime: "2024-01-15T10:00:00Z"
      tags: ["Remote Work", "Productivity", "Tips"]
      locale: "en_US"
      siteName: "Remote Work Blog"
    }
  ) {
    id
  }
}
```

### Product Page

```graphql
mutation {
  createOpenGraphMetadata(
    postId: 2
    createOpenGraphInput: {
      title: "Premium Wireless Headphones"
      description: "Experience studio-quality sound with 30-hour battery life"
      type: product
      url: "https://shop.example.com/headphones-pro"
      image: "https://shop.example.com/images/headphones.jpg"
      price: 299.99
      currency: "USD"
      availability: "in stock"
      locale: "en_US"
      siteName: "TechShop"
    }
  ) {
    id
  }
}
```

### Video Content

```graphql
mutation {
  createOpenGraphMetadata(
    postId: 3
    createOpenGraphInput: {
      title: "GraphQL Tutorial for Beginners"
      description: "Learn GraphQL from scratch in this comprehensive video course"
      type: video_movie
      url: "https://videos.example.com/graphql-tutorial"
      image: "https://videos.example.com/thumbnails/graphql.jpg"
      videoUrl: "https://videos.example.com/stream/graphql-tutorial.mp4"
      videoDuration: 3600
      videoWidth: 1920
      videoHeight: 1080
      author: "Tech Academy"
      publisher: "Video Learning Platform"
      locale: "en_US"
      twitterCard: "player"
    }
  ) {
    id
  }
}
```

### Event Page

```graphql
mutation {
  createOpenGraphMetadata(
    postId: 4
    createOpenGraphInput: {
      title: "Tech Conference 2024"
      description: "Join 5000+ developers at the premier tech event of the year"
      type: event
      url: "https://events.example.com/tech-conf-2024"
      image: "https://events.example.com/banners/tech-conf.jpg"
      eventStartTime: "2024-09-15T09:00:00Z"
      eventEndTime: "2024-09-17T18:00:00Z"
      locationAddress: "Moscone Center, San Francisco, CA 94103"
      locationLatitude: 37.7844
      locationLongitude: -122.4016
      locale: "en_US"
      siteName: "Tech Events"
    }
  ) {
    id
  }
}
```

## Migrations

The OpenGraph feature includes a database migration:

```bash
# Generate migration (already done)
npm run migration:generate src/database/migrations/AddOpenGraphMetadata

# Run migration
npm run migration:run

# Revert migration (if needed)
npm run migration:revert
```

## Seeding

Sample OpenGraph data is included in the seeder:

```bash
npm run seed
```

This creates 6 posts with rich OpenGraph metadata including:

- Article metadata with tags and author info
- Location data for travel posts
- Video metadata for tutorial content
- Complete social sharing configurations

## API Endpoints

### GraphQL Queries

- `openGraphMetadataList` - Get all OG metadata
- `openGraphMetadata(id)` - Get specific OG metadata
- `openGraphMetadataByPost(postId)` - Get OG data for a post
- `generateShareLinks(url, postId?)` - Get social share URLs
- `generateOpenGraphTags(id, baseUrl)` - Get HTML meta tags

### GraphQL Mutations

- `createOpenGraphMetadata(postId, createOpenGraphInput)` - Create OG metadata
- `updateOpenGraphMetadata(updateOpenGraphInput)` - Update OG metadata
- `removeOpenGraphMetadata(id)` - Delete OG metadata

## Testing

Run the test suite:

```bash
# All tests
npm test

# Social sharing tests only
npm test -- social-sharing.service.spec.ts
```

**Test Coverage:**

- ✅ Facebook share link generation
- ✅ Twitter share link with metadata
- ✅ LinkedIn share link generation
- ✅ HTML meta tag generation
- ✅ All OGP content types
- ✅ URL encoding and special characters
- ✅ HTML escaping in content

## Platform Documentation

### Facebook Open Graph

- **Protocol Spec**: https://ogp.me/
- **Sharing Best Practices**: https://developers.facebook.com/docs/sharing/webmasters
- **Debugger Tool**: https://developers.facebook.com/tools/debug/

### Twitter Cards

- **Card Types**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- **Markup Reference**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
- **Validator**: https://cards-dev.twitter.com/validator

### LinkedIn

- **Sharing Guide**: https://www.linkedin.com/help/linkedin/answer/46687
- **Post Inspector**: https://www.linkedin.com/post-inspector/

## Troubleshooting

### Images Not Showing

1. Ensure image URL is publicly accessible
2. Use HTTPS URLs
3. Check image dimensions (min 1200×630)
4. Verify content type is image/jpeg or image/png
5. Clear social media cache using debugger tools

### Wrong Preview on Social Media

1. Update OG metadata in database
2. Use platform debugger to refresh cache:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

### Share Count Not Updating

Social platforms cache OG data. Use their debugging tools to force a refresh.

## License

This implementation follows the [Open Graph Protocol](https://ogp.me/) specification.
