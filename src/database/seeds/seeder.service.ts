import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { Post } from '../../posts/entities/post.entity';
import { Category } from '../../categories/entities/category.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async seed() {
    console.log('Starting database seeding...');

    // Clear existing data
    await this.postRepository.clear();
    await this.profileRepository.clear();
    await this.categoryRepository.clear();
    await this.userRepository.clear();

    console.log('Cleared existing data');

    // Create categories
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

    // Create User 1 with profile and posts
    const user1 = this.userRepository.create({
      email: 'john.doe@example.com',
      name: 'John Doe',
      age: 28,
    });

    const savedUser1 = await this.userRepository.save(user1);

    const profile1 = this.profileRepository.create({
      bio: 'Full-stack developer passionate about building scalable applications',
      website: 'https://johndoe.dev',
      location: 'San Francisco, CA',
      user: savedUser1,
    });

    await this.profileRepository.save(profile1);

    const post1 = this.postRepository.create({
      title: 'Getting Started with GraphQL',
      content:
        'GraphQL is a query language for APIs that provides a complete and understandable description of the data in your API. In this post, we will explore the basics of GraphQL and how to integrate it with NestJS.',
      published: true,
      author: savedUser1,
      categories: [categories[0]],
    });

    const post2 = this.postRepository.create({
      title: 'TypeORM Best Practices',
      content:
        'TypeORM is an ORM that can run in NodeJS and can be used with TypeScript. Here are some best practices when working with TypeORM in production applications.',
      published: true,
      author: savedUser1,
      categories: [categories[0]],
    });

    await this.postRepository.save([post1, post2]);

    console.log('Created User 1 with profile and posts');

    // Create User 2 with profile and posts
    const user2 = this.userRepository.create({
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      age: 32,
    });

    const savedUser2 = await this.userRepository.save(user2);

    const profile2 = this.profileRepository.create({
      bio: 'Digital nomad, travel blogger, and coffee enthusiast',
      website: 'https://janesmithtravels.com',
      location: 'Barcelona, Spain',
      user: savedUser2,
    });

    await this.profileRepository.save(profile2);

    const post3 = this.postRepository.create({
      title: 'Working Remotely from Barcelona',
      content:
        'Barcelona has become one of the top destinations for digital nomads. Here is my experience working remotely from this beautiful city for the past year.',
      published: true,
      author: savedUser2,
      categories: [categories[1], categories[2]],
    });

    const post4 = this.postRepository.create({
      title: 'Best Coffee Shops for Remote Work',
      content:
        'Finding the perfect coffee shop to work from can be challenging. Here is my curated list of the best coffee shops in Barcelona for remote workers.',
      published: true,
      author: savedUser2,
      categories: [categories[1], categories[2]],
    });

    await this.postRepository.save([post3, post4]);

    console.log('Created User 2 with profile and posts');

    // Create User 3 with profile and posts
    const user3 = this.userRepository.create({
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
      age: 35,
    });

    const savedUser3 = await this.userRepository.save(user3);

    const profile3 = this.profileRepository.create({
      bio: 'Tech lead and architecture enthusiast',
      website: 'https://bobwilson.tech',
      location: 'London, UK',
      user: savedUser3,
    });

    await this.profileRepository.save(profile3);

    const post5 = this.postRepository.create({
      title: 'Microservices Architecture Patterns',
      content:
        'Microservices architecture is a way of building applications as a collection of small, independent services. Let us explore common patterns and best practices.',
      published: true,
      author: savedUser3,
      categories: [categories[0]],
    });

    const post6 = this.postRepository.create({
      title: 'Draft: Upcoming Tech Trends',
      content: 'This is a draft post about upcoming technology trends that I am still working on.',
      published: false,
      author: savedUser3,
      categories: [categories[0]],
    });

    await this.postRepository.save([post5, post6]);

    console.log('Created User 3 with profile and posts');

    console.log('Database seeding completed successfully!');
    console.log('Summary:');
    console.log('- 3 Users created');
    console.log('- 3 Profiles created (one-to-one with users)');
    console.log('- 3 Categories created');
    console.log('- 6 Posts created (with many-to-many relationships to categories)');
  }
}
