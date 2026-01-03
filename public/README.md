# Public Static Files

This directory contains static HTML files for testing social sharing and Open Graph metadata.

## Files

### index.html
Example static page with OpenGraph meta tags. Open this file to see how a typical blog post would look with social sharing buttons.

### posts/
Generated HTML files for each post in your database with OpenGraph metadata.

## How to Use

### 1. Serve the Files Locally

```bash
# Using http-server (recommended)
npx http-server . -p 8080

# Or using Python
python -m http.server 8080

# Or using PHP
php -S localhost:8080
```

Then open: http://localhost:8080

### 2. Test Social Sharing Locally

Click the share buttons to test the share dialogs:
- Facebook share dialog will open
- Twitter compose tweet will open
- LinkedIn share will open

**Note:** Rich previews with images won't show without a public URL.

### 3. Test with Public URL (Recommended)

To test rich previews with images, you need a publicly accessible URL:

#### Option A: Use ngrok (Quick & Easy)
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 8080
```

Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`) and use it for testing.

#### Option B: Deploy to Free Hosting
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod --dir=.`
- **GitHub Pages**: Push to repo and enable in settings

### 4. Validate with Platform Debuggers

Use your public URL with these tools:

- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/

## Generate More Pages

To generate HTML pages from your database posts:

```bash
# Make sure your NestJS app is running
npm run start:dev

# Run the generator script
node scripts/generate-static-pages.js
```

This will create files in `posts/` directory for each post with OpenGraph metadata.

## What to Test

1. **Click share buttons** - Verify dialogs open correctly
2. **Check meta tags** - View page source and inspect `<meta>` tags
3. **Validate images** - Ensure images load (check browser console)
4. **Test on platforms** - Use debugger tools to see how previews render
5. **Try different content types** - Test article, product, video, event pages

## Troubleshooting

### Images Not Loading
- Check that image URLs are publicly accessible
- Verify image URLs use HTTPS
- Check browser console for errors

### Share Preview Not Showing
- Ensure you're using a public URL (ngrok or deployed)
- Use platform debuggers to see specific errors
- Check that meta tags are in the `<head>` section

### Platform Showing Old Preview
- Social platforms cache aggressively
- Use "Scrape Again" in Facebook Debugger
- Add `?v=timestamp` to URL to force refresh

## More Information

See the main project README and documentation:
- [TESTING-GUIDE.md](../TESTING-GUIDE.md) - Complete testing guide
- [SOCIAL-SHARING.md](../SOCIAL-SHARING.md) - Social sharing documentation
- [social-sharing-queries.md](../social-sharing-queries.md) - GraphQL query examples
