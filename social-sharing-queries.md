# Social Sharing & Open Graph Protocol GraphQL Queries

This file contains GraphQL queries and mutations for testing social sharing and Open Graph Protocol features.

## Prerequisites

1. Run migrations: `npm run migration:run`
2. Seed the database: `npm run seed`
3. Start the application: `npm run start:dev`
4. Open GraphQL Playground: `http://localhost:3000/graphql`

---

## Open Graph Metadata Operations

### 1. Create OpenGraph Metadata for a Post

```graphql
mutation CreateOpenGraphMetadata {
  createOpenGraphMetadata(
    postId: 1
    createOpenGraphInput: {
      title: "Getting Started with GraphQL - Social Share"
      description: "Learn GraphQL basics and integrate it with NestJS for building powerful APIs"
      type: article
      url: "https://example.com/posts/graphql-basics"
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
      imageAlt: "GraphQL logo on laptop"
      imageWidth: 1200
      imageHeight: 630
      author: "John Doe"
      publisher: "Tech Blog"
      tags: ["GraphQL", "NestJS", "API"]
      locale: "en_US"
      siteName: "My Tech Blog"
      twitterCard: "summary_large_image"
      twitterSite: "@mytechblog"
      twitterCreator: "@johndoe"
    }
  ) {
    id
    title
    description
    type
    url
    image
    author
    tags
    post {
      id
      title
    }
  }
}
```

### 2. Get All OpenGraph Metadata

```graphql
query GetAllOpenGraphMetadata {
  openGraphMetadataList {
    id
    title
    description
    type
    url
    image
    imageAlt
    author
    publisher
    tags
    locale
    siteName
    twitterCard
    twitterSite
    twitterCreator
    post {
      id
      title
      author {
        name
      }
    }
  }
}
```

### 3. Get OpenGraph Metadata by ID

```graphql
query GetOpenGraphMetadata {
  openGraphMetadata(id: 1) {
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
    modifiedTime
    tags
    videoUrl
    videoDuration
    audioUrl
    price
    currency
    availability
    eventStartTime
    eventEndTime
    locationAddress
    locationLatitude
    locationLongitude
    locale
    siteName
    twitterCard
    twitterSite
    twitterCreator
    post {
      id
      title
      content
      published
    }
  }
}
```

### 4. Get OpenGraph Metadata by Post ID

```graphql
query GetOpenGraphByPost {
  openGraphMetadataByPost(postId: 1) {
    id
    title
    description
    type
    url
    image
    author
    tags
  }
}
```

### 5. Update OpenGraph Metadata

```graphql
mutation UpdateOpenGraphMetadata {
  updateOpenGraphMetadata(
    updateOpenGraphInput: {
      id: 1
      title: "Updated Title for Social Sharing"
      description: "Updated description with more details"
      tags: ["GraphQL", "NestJS", "TypeScript", "API"]
    }
  ) {
    id
    title
    description
    tags
    post {
      title
    }
  }
}
```

### 6. Delete OpenGraph Metadata

```graphql
mutation RemoveOpenGraphMetadata {
  removeOpenGraphMetadata(id: 1) {
    id
    title
  }
}
```

---

## Social Sharing Links

### 7. Generate Share Links for a URL

```graphql
query GenerateShareLinks {
  generateShareLinks(url: "https://example.com/posts/my-awesome-post") {
    facebook
    twitter
    linkedin
  }
}
```

### 8. Generate Share Links with Post Metadata

```graphql
query GenerateShareLinksWithMetadata {
  generateShareLinks(url: "https://example.com/posts/my-awesome-post", postId: 1) {
    facebook
    twitter
    linkedin
  }
}
```

### 9. Generate Open Graph HTML Tags

```graphql
query GenerateOGTags {
  generateOpenGraphTags(id: 1, baseUrl: "https://example.com")
}
```

---

## Advanced Examples

### 10. Create Product OpenGraph Metadata

```graphql
mutation CreateProductOG {
  createOpenGraphMetadata(
    postId: 2
    createOpenGraphInput: {
      title: "Amazing Product Name"
      description: "The best product you'll ever buy"
      type: product
      url: "https://example.com/products/amazing-product"
      image: "https://example.com/product-image.jpg"
      imageAlt: "Product photo"
      imageWidth: 1200
      imageHeight: 630
      price: 99.99
      currency: "USD"
      availability: "in stock"
      locale: "en_US"
      siteName: "Our Store"
    }
  ) {
    id
    title
    type
    price
    currency
    availability
  }
}
```

### 11. Create Video Content OpenGraph Metadata

```graphql
mutation CreateVideoOG {
  createOpenGraphMetadata(
    postId: 3
    createOpenGraphInput: {
      title: "Introduction to Microservices"
      description: "Watch our comprehensive guide to microservices architecture"
      type: video_movie
      url: "https://example.com/videos/microservices-intro"
      image: "https://example.com/video-thumbnail.jpg"
      videoUrl: "https://example.com/videos/microservices-intro.mp4"
      videoDuration: 1800
      videoWidth: 1920
      videoHeight: 1080
      author: "Bob Wilson"
      publisher: "Tech Education"
      locale: "en_US"
      siteName: "Tech Learning Platform"
      twitterCard: "player"
    }
  ) {
    id
    title
    type
    videoUrl
    videoDuration
    videoWidth
    videoHeight
  }
}
```

### 12. Create Event OpenGraph Metadata

```graphql
mutation CreateEventOG {
  createOpenGraphMetadata(
    postId: 4
    createOpenGraphInput: {
      title: "Tech Conference 2024"
      description: "Join us for the biggest tech conference of the year"
      type: event
      url: "https://example.com/events/tech-conf-2024"
      image: "https://example.com/event-banner.jpg"
      eventStartTime: "2024-06-15T09:00:00Z"
      eventEndTime: "2024-06-17T18:00:00Z"
      locationAddress: "Convention Center, San Francisco, CA"
      locationLatitude: 37.7749
      locationLongitude: -122.4194
      locale: "en_US"
      siteName: "Tech Events"
    }
  ) {
    id
    title
    type
    eventStartTime
    eventEndTime
    locationAddress
    locationLatitude
    locationLongitude
  }
}
```

### 13. Create Article with Location

```graphql
mutation CreateArticleWithLocation {
  createOpenGraphMetadata(
    postId: 3
    createOpenGraphInput: {
      title: "Best Restaurants in Barcelona"
      description: "A food lover's guide to Barcelona's finest dining experiences"
      type: article
      url: "https://example.com/travel/barcelona-restaurants"
      image: "https://example.com/barcelona-food.jpg"
      author: "Jane Smith"
      publisher: "Travel Guide"
      locationAddress: "Barcelona, Catalonia, Spain"
      locationLatitude: 41.3874
      locationLongitude: 2.1686
      tags: ["Travel", "Food", "Barcelona", "Spain"]
      locale: "en_US"
      siteName: "Travel Blog"
    }
  ) {
    id
    title
    locationAddress
    locationLatitude
    locationLongitude
    tags
  }
}
```

### 14. Get Post with OpenGraph Metadata

```graphql
query GetPostWithOG {
  post(id: 1) {
    id
    title
    content
    published
    author {
      name
      email
    }
    openGraphMetadata {
      title
      description
      image
      url
      type
      tags
    }
  }
}
```

### 15. Get All Posts with OpenGraph Data

```graphql
query GetAllPostsWithOG {
  posts {
    id
    title
    published
    author {
      name
    }
    categories {
      name
    }
    openGraphMetadata {
      title
      description
      image
      url
      type
      author
      tags
    }
  }
}
```

---

## Testing Social Sharing

### Test Facebook Sharing

```graphql
query TestFacebookShare {
  generateShareLinks(url: "https://example.com/posts/awesome-article", postId: 1) {
    facebook
  }
}
```

Copy the `facebook` URL from the response and paste it into your browser to test the Facebook share dialog.

### Test Twitter Sharing

```graphql
query TestTwitterShare {
  generateShareLinks(url: "https://example.com/posts/awesome-article", postId: 1) {
    twitter
  }
}
```

The Twitter link will include the post title and hashtags from the OpenGraph metadata.

### Test LinkedIn Sharing

```graphql
query TestLinkedInShare {
  generateShareLinks(url: "https://example.com/posts/awesome-article", postId: 1) {
    linkedin
  }
}
```

### Get Complete HTML Meta Tags

```graphql
query GetMetaTags {
  generateOpenGraphTags(id: 1, baseUrl: "https://example.com")
}
```

This returns HTML meta tags that you can insert into the `<head>` section of your web pages for rich social sharing.

---

## Validation Examples

### Invalid Type (Will fail validation)

```graphql
mutation InvalidType {
  createOpenGraphMetadata(
    postId: 1
    createOpenGraphInput: {
      title: "Test"
      description: "Test"
      type: "invalid_type" # This will fail - must be a valid OgType enum
    }
  ) {
    id
  }
}
```

### Invalid URL (Will fail validation)

```graphql
mutation InvalidURL {
  createOpenGraphMetadata(
    postId: 1
    createOpenGraphInput: {
      title: "Test"
      description: "Test"
      type: article
      url: "not-a-valid-url" # This will fail URL validation
    }
  ) {
    id
  }
}
```

---

## Available OgType Values

- `article` - Blog posts, news articles
- `website` - General website content
- `video_movie` - Video content
- `music_song` - Music content
- `book` - Books and publications
- `profile` - User profiles
- `product` - E-commerce products
- `event` - Events and conferences
- `recipe` - Recipe content

---

## Social Media Platform Documentation

- **Facebook**: https://developers.facebook.com/docs/sharing/webmasters
- **Twitter**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
- **LinkedIn**: https://www.linkedin.com/help/linkedin/answer/46687

---

## Notes

- All share links are generated dynamically and can be customized with OpenGraph metadata
- Images should be at least 1200x630 pixels for best results
- Twitter cards support `summary`, `summary_large_image`, and `player` types
- Location data helps with local search and event promotion
- Product metadata is essential for e-commerce sites
- Video metadata helps with video SEO and sharing
