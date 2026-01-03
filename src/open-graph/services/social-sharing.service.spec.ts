import { Test, TestingModule } from '@nestjs/testing';
import { SocialSharingService } from './social-sharing.service';
import { OpenGraphMetadataEntity } from '../entities/open-graph-metadata.entity';
import { OgType } from '../entities/open-graph-metadata.entity';

describe('SocialSharingService', () => {
  let service: SocialSharingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialSharingService],
    }).compile();

    service = module.get<SocialSharingService>(SocialSharingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFacebookShareLink', () => {
    it('should generate a valid Facebook share link', () => {
      const url = 'https://example.com/post/123';
      const result = service.generateFacebookShareLink(url);

      expect(result).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
      expect(result).toContain('facebook.com/sharer');
      expect(result).toContain(encodeURIComponent(url));
    });

    it('should handle URLs with special characters', () => {
      const url = 'https://example.com/post?id=123&type=article';
      const result = service.generateFacebookShareLink(url);

      expect(result).toContain(encodeURIComponent(url));
    });
  });

  describe('generateTwitterShareLink', () => {
    it('should generate a Twitter share link without metadata', () => {
      const url = 'https://example.com/post/123';
      const result = service.generateTwitterShareLink(url);

      expect(result).toContain('twitter.com/intent/tweet');
      expect(result).toContain(`url=${encodeURIComponent(url)}`);
    });

    it('should include title as text when metadata is provided', () => {
      const url = 'https://example.com/post/123';
      const metadata = {
        title: 'My Awesome Post',
        tags: ['tech', 'javascript'],
      } as OpenGraphMetadataEntity;

      const result = service.generateTwitterShareLink(url, metadata);

      expect(result).toContain('text=My+Awesome+Post');
      expect(result).toContain('hashtags=tech%2Cjavascript');
    });

    it('should include via parameter when twitterSite is provided', () => {
      const url = 'https://example.com/post/123';
      const metadata = {
        title: 'Test Post',
        twitterSite: '@mysite',
      } as OpenGraphMetadataEntity;

      const result = service.generateTwitterShareLink(url, metadata);

      expect(result).toContain('via=mysite');
    });

    it('should limit hashtags to first 2 tags', () => {
      const url = 'https://example.com/post/123';
      const metadata = {
        title: 'Test',
        tags: ['one', 'two', 'three', 'four'],
      } as OpenGraphMetadataEntity;

      const result = service.generateTwitterShareLink(url, metadata);

      expect(result).toContain('hashtags=one%2Ctwo');
      expect(result).not.toContain('three');
    });
  });

  describe('generateLinkedInShareLink', () => {
    it('should generate a valid LinkedIn share link', () => {
      const url = 'https://example.com/post/123';
      const result = service.generateLinkedInShareLink(url);

      expect(result).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
      expect(result).toContain('linkedin.com/sharing');
    });
  });

  describe('generateShareLinks', () => {
    it('should generate all share links', () => {
      const url = 'https://example.com/post/123';
      const result = service.generateShareLinks(url);

      expect(result).toHaveProperty('facebook');
      expect(result).toHaveProperty('twitter');
      expect(result).toHaveProperty('linkedin');
      expect(result.facebook).toContain('facebook.com');
      expect(result.twitter).toContain('twitter.com');
      expect(result.linkedin).toContain('linkedin.com');
    });

    it('should include metadata in Twitter link when provided', () => {
      const url = 'https://example.com/post/123';
      const metadata = {
        title: 'Test Post',
        tags: ['tech'],
      } as OpenGraphMetadataEntity;

      const result = service.generateShareLinks(url, metadata);

      expect(result.twitter).toContain('text=Test+Post');
      expect(result.twitter).toContain('hashtags=tech');
    });
  });

  describe('generateOpenGraphTags', () => {
    it('should generate basic Open Graph tags', () => {
      const metadata = {
        title: 'Test Post',
        description: 'This is a test post',
        type: OgType.ARTICLE,
        url: 'https://example.com/post/123',
        locale: 'en_US',
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('og:title');
      expect(result).toContain('og:description');
      expect(result).toContain('og:type');
      expect(result).toContain('article');
    });

    it('should include image tags when image is provided', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        type: OgType.ARTICLE,
        image: 'https://example.com/image.jpg',
        imageAlt: 'Test image',
        imageWidth: 1200,
        imageHeight: 630,
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('og:image');
      expect(result).toContain('og:image:alt');
      expect(result).toContain('og:image:width');
      expect(result).toContain('og:image:height');
    });

    it('should include article-specific tags', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        type: OgType.ARTICLE,
        author: 'John Doe',
        publisher: 'Example Publisher',
        publishedTime: new Date('2024-01-01'),
        tags: ['tech', 'javascript'],
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('article:author');
      expect(result).toContain('article:publisher');
      expect(result).toContain('article:published_time');
      expect(result).toContain('article:tag');
    });

    it('should include video tags when provided', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        type: OgType.VIDEO,
        videoUrl: 'https://example.com/video.mp4',
        videoDuration: 120,
        videoWidth: 1920,
        videoHeight: 1080,
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('og:video');
      expect(result).toContain('og:video:duration');
      expect(result).toContain('og:video:width');
      expect(result).toContain('og:video:height');
    });

    it('should include product tags', () => {
      const metadata = {
        title: 'Test Product',
        description: 'Test',
        type: OgType.PRODUCT,
        price: 99.99,
        currency: 'USD',
        availability: 'in stock',
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('product:price:amount');
      expect(result).toContain('product:price:currency');
      expect(result).toContain('product:availability');
    });

    it('should include location tags', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        type: OgType.ARTICLE,
        locationAddress: '123 Main St, City',
        locationLatitude: 40.7128,
        locationLongitude: -74.006,
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('og:location:address');
      expect(result).toContain('og:location:latitude');
      expect(result).toContain('og:location:longitude');
    });

    it('should include Twitter Card tags', () => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        type: OgType.ARTICLE,
        twitterCard: 'summary_large_image',
        twitterSite: '@example',
        twitterCreator: '@johndoe',
        image: 'https://example.com/image.jpg',
        imageAlt: 'Test image',
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('twitter:card');
      expect(result).toContain('twitter:title');
      expect(result).toContain('twitter:description');
      expect(result).toContain('twitter:image');
      expect(result).toContain('twitter:site');
      expect(result).toContain('twitter:creator');
    });

    it('should escape HTML special characters in content', () => {
      const metadata = {
        title: 'Test & "Special" <Characters>',
        description: "Test with 'quotes'",
        type: OgType.ARTICLE,
      } as OpenGraphMetadataEntity;

      const result = service.generateOpenGraphTags(metadata, 'https://example.com');

      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&#039;');
    });
  });
});
