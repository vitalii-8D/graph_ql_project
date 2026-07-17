import { Injectable } from '@nestjs/common';

import { OpenGraphMetadataEntity, OgType } from '../entities/open-graph-metadata.entity';
import { SocialPlatform } from '../enums';
import { ShareLinks } from '../types';

const SocialBaseUrl: Record<keyof typeof SocialPlatform, string> = {
  Facebook: 'https://www.facebook.com/sharer/sharer.php',
  Twitter: 'https://twitter.com/intent/tweet',
  LinkedIn: 'https://www.linkedin.com/sharing/share-offsite/',
};

@Injectable()
export class SocialSharingService {
  /**
   * Generate social media share links for a given URL
   * @param url - The URL to share
   * @param metadata - Optional OpenGraph metadata for customization
   * @returns Object containing share links for Facebook, Twitter, and LinkedIn
   */
  generateShareLinks(url: string, metadata?: OpenGraphMetadataEntity): ShareLinks {
    return {
      facebook: this.generateFacebookShareLink(url),
      twitter: this.generateTwitterShareLink(url, metadata),
      linkedin: this.generateLinkedInShareLink(url),
    };
  }

  /**
   * Generate Facebook share link
   * Documentation: https://developers.facebook.com/docs/sharing/reference/share-dialog
   * @param url - The URL to share
   * @returns Facebook share URL
   */
  generateFacebookShareLink(url: string): string {
    const encodedUrl = encodeURIComponent(url);
    return `${SocialBaseUrl.Facebook}?u=${encodedUrl}`;
  }

  /**
   * Generate Twitter share link
   * Documentation: https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview
   * @param url - The URL to share
   * @param metadata - Optional metadata for tweet customization
   * @returns Twitter share URL
   */
  generateTwitterShareLink(url: string, metadata?: OpenGraphMetadataEntity): string {
    const params = new URLSearchParams();
    params.append('url', url);

    if (metadata?.title) {
      // Twitter limits tweet text, so we'll use title as the tweet text
      params.append('text', metadata.title);
    }

    if (metadata?.twitterSite) {
      params.append('via', metadata.twitterSite.replace('@', ''));
    }

    if (metadata?.tags && metadata.tags.length > 0) {
      // Add first 2 tags as hashtags
      const hashtags = metadata.tags.slice(0, 2).join(',');
      params.append('hashtags', hashtags);
    }

    return `${SocialBaseUrl.Twitter}?${params.toString()}`;
  }

  /**
   * Generate LinkedIn share link
   * Documentation: https://www.linkedin.com/developers/tools/share-plugin
   * @param url - The URL to share
   * @returns LinkedIn share URL
   */
  generateLinkedInShareLink(url: string): string {
    const encodedUrl = encodeURIComponent(url);
    return `${SocialBaseUrl.LinkedIn}?url=${encodedUrl}`;
  }

  /**
   * Generate Open Graph meta tags HTML
   * @param metadata - OpenGraph metadata
   * @param _baseUrl - Base URL of the application
   * @returns HTML string with meta tags
   */
  generateOpenGraphTags(metadata: OpenGraphMetadataEntity, _baseUrl: string): string {
    const tags: string[] = [];

    // Basic Open Graph tags
    tags.push(`<meta property="og:title" content="${this.escapeHtml(metadata.title)}" />`);
    tags.push(`<meta property="og:description" content="${this.escapeHtml(metadata.description)}" />`);
    tags.push(`<meta property="og:type" content="${metadata.type}" />`);

    if (metadata.url) {
      tags.push(`<meta property="og:url" content="${metadata.url}" />`);
    }

    if (metadata.image) {
      tags.push(`<meta property="og:image" content="${metadata.image}" />`);
      if (metadata.imageAlt) {
        tags.push(`<meta property="og:image:alt" content="${this.escapeHtml(metadata.imageAlt)}" />`);
      }
      if (metadata.imageWidth) {
        tags.push(`<meta property="og:image:width" content="${metadata.imageWidth}" />`);
      }
      if (metadata.imageHeight) {
        tags.push(`<meta property="og:image:height" content="${metadata.imageHeight}" />`);
      }
    }

    if (metadata.siteName) {
      tags.push(`<meta property="og:site_name" content="${this.escapeHtml(metadata.siteName)}" />`);
    }

    if (metadata.locale) {
      tags.push(`<meta property="og:locale" content="${metadata.locale}" />`);
    }

    // Article specific tags
    if (metadata.type === OgType.ARTICLE) {
      if (metadata.author) {
        tags.push(`<meta property="article:author" content="${this.escapeHtml(metadata.author)}" />`);
      }
      if (metadata.publisher) {
        tags.push(`<meta property="article:publisher" content="${this.escapeHtml(metadata.publisher)}" />`);
      }
      if (metadata.publishedTime) {
        tags.push(`<meta property="article:published_time" content="${metadata.publishedTime.toISOString()}" />`);
      }
      if (metadata.modifiedTime) {
        tags.push(`<meta property="article:modified_time" content="${metadata.modifiedTime.toISOString()}" />`);
      }
      if (metadata.tags) {
        metadata.tags.forEach((tag) => {
          tags.push(`<meta property="article:tag" content="${this.escapeHtml(tag)}" />`);
        });
      }
    }

    // Video tags
    if (metadata.videoUrl) {
      tags.push(`<meta property="og:video" content="${metadata.videoUrl}" />`);
      if (metadata.videoDuration) {
        tags.push(`<meta property="og:video:duration" content="${metadata.videoDuration}" />`);
      }
      if (metadata.videoWidth) {
        tags.push(`<meta property="og:video:width" content="${metadata.videoWidth}" />`);
      }
      if (metadata.videoHeight) {
        tags.push(`<meta property="og:video:height" content="${metadata.videoHeight}" />`);
      }
    }

    // Audio tags
    if (metadata.audioUrl) {
      tags.push(`<meta property="og:audio" content="${metadata.audioUrl}" />`);
    }

    // Product tags
    if (metadata.type === OgType.PRODUCT) {
      if (metadata.price !== null && metadata.price !== undefined) {
        tags.push(`<meta property="product:price:amount" content="${metadata.price}" />`);
      }
      if (metadata.currency) {
        tags.push(`<meta property="product:price:currency" content="${metadata.currency}" />`);
      }
      if (metadata.availability) {
        tags.push(`<meta property="product:availability" content="${metadata.availability}" />`);
      }
    }

    // Event tags
    if (metadata.type === OgType.EVENT) {
      if (metadata.eventStartTime) {
        tags.push(`<meta property="event:start_time" content="${metadata.eventStartTime.toISOString()}" />`);
      }
      if (metadata.eventEndTime) {
        tags.push(`<meta property="event:end_time" content="${metadata.eventEndTime.toISOString()}" />`);
      }
    }

    // Location tags
    if (metadata.locationAddress) {
      tags.push(`<meta property="og:location:address" content="${this.escapeHtml(metadata.locationAddress)}" />`);
    }
    if (metadata.locationLatitude !== null && metadata.locationLatitude !== undefined) {
      tags.push(`<meta property="og:location:latitude" content="${metadata.locationLatitude}" />`);
    }
    if (metadata.locationLongitude !== null && metadata.locationLongitude !== undefined) {
      tags.push(`<meta property="og:location:longitude" content="${metadata.locationLongitude}" />`);
    }

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="${metadata.twitterCard ?? 'summary_large_image'}" />`);
    tags.push(`<meta name="twitter:title" content="${this.escapeHtml(metadata.title)}" />`);
    tags.push(`<meta name="twitter:description" content="${this.escapeHtml(metadata.description)}" />`);

    if (metadata.image) {
      tags.push(`<meta name="twitter:image" content="${metadata.image}" />`);
      if (metadata.imageAlt) {
        tags.push(`<meta name="twitter:image:alt" content="${this.escapeHtml(metadata.imageAlt)}" />`);
      }
    }

    if (metadata.twitterSite) {
      tags.push(`<meta name="twitter:site" content="${metadata.twitterSite}" />`);
    }

    if (metadata.twitterCreator) {
      tags.push(`<meta name="twitter:creator" content="${metadata.twitterCreator}" />`);
    }

    return tags.join('\n');
  }

  /**
   * Escape HTML special characters
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
