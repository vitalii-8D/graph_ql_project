import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { OpenGraphMetadataEntity } from '../../open-graph/entities/open-graph-metadata.entity';
import { OgType } from '../../open-graph/entities/open-graph-metadata.entity';
import { PasswordUtil } from '../../utils/password.util';

const MOCK_PASSWORD = 'Password!1';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(OpenGraphMetadataEntity)
    private openGraphRepository: Repository<OpenGraphMetadataEntity>,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async seed() {
    console.log('Starting database seeding...');

    // await this.clearExistingData();

    const categories = await this.createCategories();
    await this.createUser1WithPosts(categories);
    await this.createUser2WithPosts(categories);
    await this.createUser3WithPosts(categories);

    console.log('Database seeding completed successfully!');
    console.log('Summary:');
    console.log('- 3 Users created');
    console.log('- 3 Categories created');
    console.log('- 6 Posts created (with many-to-many relationships to categories)');
    console.log('- 6 OpenGraph metadata records created (with rich social sharing data)');
  }

  // private async clearExistingData() {
  //   await this.openGraphRepository.clear();
  //   await this.postRepository.clear();
  //   await this.categoryRepository.clear();
  //   await this.userRepository.clear();
  //   console.log('Cleared existing data');
  // }

  private async createCategories(): Promise<CategoryEntity[]> {
    const techCategory = this.categoryRepository.create({
      name: 'Technology',
      description: 'Tech-related posts',
    });

    const lifestyleCategory = this.categoryRepository.create({
      name: 'Lifestyle',
      description: 'Lifestyle and wellness posts',
    });

    const travelCategory = this.categoryRepository.create({
      name: 'Travel',
      description: 'Travel experiences and tips',
    });

    const categories = await this.categoryRepository.save([techCategory, lifestyleCategory, travelCategory]);
    console.log('Created categories');
    return categories;
  }

  private async createUser1WithPosts(categories: CategoryEntity[]) {
    const user1 = this.userRepository.create({
      email: 'john.doe@example.com',
      name: 'John Doe',
      age: 28,
      password: await this.passwordUtil.hash(MOCK_PASSWORD),
    });

    const savedUser1 = await this.userRepository.save(user1);

    const post1 = this.postRepository.create({
      title: 'Getting Started with GraphQL',
      content:
        'GraphQL is a query language for APIs that provides a complete and understandable description of the data in your API. In this post, we will explore the basics of GraphQL and how to integrate it with NestJS.',
      published: true,
      author: savedUser1,
      categories: [categories[0]],
    });

    const savedPost1 = await this.postRepository.save(post1);

    const og1 = this.openGraphRepository.create({
      title: 'Getting Started with GraphQL',
      description: 'Learn the basics of GraphQL and how to integrate it with NestJS framework.',
      type: OgType.ARTICLE,
      url: 'https://example.com/posts/getting-started-with-graphql',
      image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
      imageAlt: 'GraphQL code on laptop screen',
      imageWidth: 320,
      imageHeight: 320,
      author: 'John Doe',
      publisher: 'Tech Blog',
      publishedTime: new Date('2024-01-15'),
      tags: ['GraphQL', 'NestJS', 'API', 'TypeScript'],
      locale: 'en_US',
      siteName: 'Tech Blog',
      twitterCard: 'summary_large_image',
      twitterSite: '@techblog',
      twitterCreator: '@johndoe',
      post: savedPost1,
    });

    await this.openGraphRepository.save(og1);

    const post2 = this.postRepository.create({
      title: 'TypeORM Best Practices',
      content:
        'TypeORM is an ORM that can run in NodeJS and can be used with TypeScript. Here are some best practices when working with TypeORM in production applications.',
      published: true,
      author: savedUser1,
      categories: [categories[0]],
    });

    const savedPost2 = await this.postRepository.save(post2);

    const og2 = this.openGraphRepository.create({
      title: 'TypeORM Best Practices for Production',
      description: 'Essential best practices for using TypeORM in production Node.js applications.',
      type: OgType.ARTICLE,
      url: 'https://example.com/posts/typeorm-best-practices',
      image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
      imageAlt: 'Database schema diagram',
      imageWidth: 320,
      imageHeight: 320,
      author: 'John Doe',
      publisher: 'Tech Blog',
      publishedTime: new Date('2024-02-01'),
      tags: ['TypeORM', 'Database', 'NodeJS', 'Best Practices'],
      locale: 'en_US',
      siteName: 'Tech Blog',
      twitterCard: 'summary_large_image',
      twitterSite: '@techblog',
      twitterCreator: '@johndoe',
      post: savedPost2,
    });

    await this.openGraphRepository.save(og2);

    console.log('Created User 1 with posts with OpenGraph metadata');
  }

  private async createUser2WithPosts(categories: CategoryEntity[]) {
    const user2 = this.userRepository.create({
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      age: 32,
      password: await this.passwordUtil.hash(MOCK_PASSWORD),
    });

    const savedUser2 = await this.userRepository.save(user2);

    const post3 = this.postRepository.create({
      title: 'Working Remotely from Barcelona',
      content:
        'Barcelona has become one of the top destinations for digital nomads. Here is my experience working remotely from this beautiful city for the past year.',
      published: true,
      author: savedUser2,
      categories: [categories[1], categories[2]],
    });

    const savedPost3 = await this.postRepository.save(post3);

    const og3 = this.openGraphRepository.create({
      title: "Working Remotely from Barcelona: A Digital Nomad's Guide",
      description:
        "Discover what it's like to work remotely from Barcelona, one of Europe's top digital nomad destinations.",
      type: OgType.ARTICLE,
      url: 'https://example.com/posts/working-remotely-barcelona',
      image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
      imageAlt: 'Barcelona cityscape',
      imageWidth: 320,
      imageHeight: 320,
      author: 'Jane Smith',
      publisher: 'Travel Blog',
      publishedTime: new Date('2024-03-10'),
      tags: ['Remote Work', 'Barcelona', 'Digital Nomad', 'Travel'],
      locationAddress: 'Barcelona, Catalonia, Spain',
      locationLatitude: 41.3874,
      locationLongitude: 2.1686,
      locale: 'en_US',
      siteName: 'Travel Blog',
      twitterCard: 'summary_large_image',
      twitterSite: '@travelblog',
      twitterCreator: '@janesmith',
      post: savedPost3,
    });

    await this.openGraphRepository.save(og3);

    const post4 = this.postRepository.create({
      title: 'Best Coffee Shops for Remote Work',
      content:
        'Finding the perfect coffee shop to work from can be challenging. Here is my curated list of the best coffee shops in Barcelona for remote workers.',
      published: true,
      author: savedUser2,
      categories: [categories[1], categories[2]],
    });

    const savedPost4 = await this.postRepository.save(post4);

    const og4 = this.openGraphRepository.create({
      title: 'Best Coffee Shops for Remote Work in Barcelona',
      description:
        'A curated guide to the best coffee shops in Barcelona perfect for remote workers and digital nomads.',
      type: OgType.ARTICLE,
      url: 'https://example.com/posts/best-coffee-shops-remote-work',
      image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
      imageAlt: 'Cozy coffee shop interior',
      imageWidth: 320,
      imageHeight: 320,
      author: 'Jane Smith',
      publisher: 'Travel Blog',
      publishedTime: new Date('2024-03-20'),
      tags: ['Coffee Shops', 'Remote Work', 'Barcelona', 'Guide'],
      locationAddress: 'Barcelona, Spain',
      locale: 'en_US',
      siteName: 'Travel Blog',
      twitterCard: 'summary_large_image',
      twitterSite: '@travelblog',
      twitterCreator: '@janesmith',
      post: savedPost4,
    });

    await this.openGraphRepository.save(og4);

    console.log('Created User 2 with posts with OpenGraph metadata');
  }

  private async createUser3WithPosts(categories: CategoryEntity[]) {
    const user3 = this.userRepository.create({
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
      age: 35,
      password: await this.passwordUtil.hash(MOCK_PASSWORD),
    });

    const savedUser3 = await this.userRepository.save(user3);

    const post5 = this.postRepository.create({
      title: 'Microservices Architecture Patterns',
      content:
        'Microservices architecture is a way of building applications as a collection of small, independent services. Let us explore common patterns and best practices.',
      published: true,
      author: savedUser3,
      categories: [categories[0]],
    });

    const savedPost5 = await this.postRepository.save(post5);

    const og5 = this.openGraphRepository.create({
      title: 'Microservices Architecture Patterns Explained',
      description:
        'Comprehensive guide to microservices architecture patterns with real-world examples and best practices.',
      type: OgType.ARTICLE,
      url: 'https://example.com/posts/microservices-architecture-patterns',
      image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
      imageAlt: 'Microservices architecture diagram',
      imageWidth: 320,
      imageHeight: 320,
      author: 'Bob Wilson',
      publisher: 'Tech Blog',
      publishedTime: new Date('2024-04-01'),
      modifiedTime: new Date('2024-04-05'),
      tags: ['Microservices', 'Architecture', 'Software Design', 'Best Practices'],
      videoUrl: 'https://example.com/videos/microservices-intro.mp4',
      videoDuration: 320,
      videoWidth: 1920,
      videoHeight: 1080,
      locale: 'en_US',
      siteName: 'Tech Blog',
      twitterCard: 'player',
      twitterSite: '@techblog',
      twitterCreator: '@bobwilson',
      post: savedPost5,
    });

    await this.openGraphRepository.save(og5);

    const post6 = this.postRepository.create({
      title: 'Draft: Upcoming Tech Trends',
      content: 'This is a draft post about upcoming technology trends that I am still working on.',
      published: false,
      author: savedUser3,
      categories: [categories[0]],
    });

    const savedPost6 = await this.postRepository.save(post6);

    const og6 = this.openGraphRepository.create({
      title: 'Upcoming Tech Trends 2024',
      description:
        'An in-depth analysis of upcoming technology trends that will shape the future of software development.',
      type: OgType.ARTICLE,
      url: 'https://example.com/posts/upcoming-tech-trends-2024',
      image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
      imageAlt: 'Futuristic technology concept',
      imageWidth: 320,
      imageHeight: 320,
      author: 'Bob Wilson',
      publisher: 'Tech Blog',
      tags: ['Tech Trends', '2024', 'Future', 'Innovation'],
      locale: 'en_US',
      siteName: 'Tech Blog',
      twitterCard: 'summary_large_image',
      twitterSite: '@techblog',
      twitterCreator: '@bobwilson',
      post: savedPost6,
    });

    await this.openGraphRepository.save(og6);

    console.log('Created User 3 with posts with OpenGraph metadata');
  }
}
