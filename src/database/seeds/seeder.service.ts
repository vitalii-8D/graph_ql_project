import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums';
import { PostEntity } from '../../posts/entities/post.entity';
import { PostStatus } from '../../posts/enums';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { OpenGraphMetadataEntity, OgType } from '../../open-graph/entities/open-graph-metadata.entity';
import { PasswordUtil } from '../../utils/password.util';
import { formatSlug } from '../../utils/format-slug';

const MOCK_PASSWORD = 'Password!1';
const AVERAGE_READING_SPEED_WPM = 200;
const ADMIN_USER_PROBABILITY = 0.1;
const MAX_COMMENTS_PER_POST = 20;

const BASE_CITY = 'Івано-Франківськ';
const BASE_LOCATION = { latitude: 48.9224763, longitude: 24.710334 };
const EARTH_RADIUS_KM = 6371;

const DISTANCE_BANDS_KM = [
  { maxKm: 5, weight: 30 }, // 50% within 5km
  { maxKm: 25, weight: 30 }, // 30% within 5-25km
  { maxKm: 100, weight: 20 }, // 15% within 25-100km
  { maxKm: 200, weight: 20 }, // 5% within 100-200km
];

const CATEGORY_SEEDS = [
  { name: 'Technology', description: 'Tech-related posts' },
  { name: 'Lifestyle', description: 'Lifestyle and wellness posts' },
  { name: 'Travel', description: 'Travel experiences and tips' },
  { name: 'News', description: "World's news" },
];

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
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async seed(usersCount: number, postsCount: number): Promise<void> {
    console.log(`Starting database seeding with ${usersCount} user(s) and ${postsCount} post(s)...`);

    const categories = await this.createCategories();

    const users = await this.createUsers(usersCount);

    const posts = await this.createPosts(postsCount, users, categories);

    await this.createComments(posts, users);

    this.logBreakdown(users, posts);

    console.log('\nDatabase seeding completed successfully!');
  }

  private async createCategories(): Promise<CategoryEntity[]> {
    console.log('Creating categories...');

    const categoryNames = CATEGORY_SEEDS.map((category) => category.name);
    const existingCategories = await this.categoryRepository.find({ where: { name: In(categoryNames) } });
    const existingNames = new Set(existingCategories.map((category) => category.name));

    const missingCategories = CATEGORY_SEEDS.filter((category) => !existingNames.has(category.name));

    if (missingCategories.length > 0) {
      await this.categoryRepository.save(missingCategories.map((category) => this.categoryRepository.create(category)));
    }

    const categories = await this.categoryRepository.find({ where: { name: In(categoryNames) } });

    console.log(`Created ${missingCategories.length} new categories (${categories.length} total)`);

    return categories;
  }

  private async createUsers(count: number): Promise<UserEntity[]> {
    console.log('Creating users...');

    const passwordHash = await this.passwordUtil.hash(MOCK_PASSWORD);
    const users = Array.from({ length: count }, () => this.buildFakeUser(passwordHash));
    const savedUsers = await this.userRepository.save(this.userRepository.create(users));

    console.log(`Created ${savedUsers.length} users`);

    return savedUsers;
  }

  private buildFakeUser(passwordHash: string): Partial<UserEntity> {
    const createdAt = faker.date.recent({ days: 10 });

    return {
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 70 }),
      password: passwordHash,
      role: faker.datatype.boolean({ probability: ADMIN_USER_PROBABILITY }) ? UserRole.ADMIN : UserRole.USER,
      city: BASE_CITY,
      ...this.randomLocationNearBase(),
      lastActiveAt: faker.date.recent({ days: 30 }),
      isOnline: false,
      createdAt,
    };
  }

  private randomLocationNearBase(): { latitude: number; longitude: number } {
    const { minKm, maxKm } = this.pickDistanceBand();

    const angle = faker.number.float({ min: 0, max: 2 * Math.PI });
    // sqrt spacing keeps points uniformly spread by area across the ring, instead of bunching near its inner edge
    const distanceKm = Math.sqrt(faker.number.float({ min: minKm ** 2, max: maxKm ** 2 }));

    const baseLatRad = (BASE_LOCATION.latitude * Math.PI) / 180;
    const deltaLat = ((distanceKm * Math.cos(angle)) / EARTH_RADIUS_KM) * (180 / Math.PI);
    const deltaLon = ((distanceKm * Math.sin(angle)) / (EARTH_RADIUS_KM * Math.cos(baseLatRad))) * (180 / Math.PI);

    return {
      latitude: BASE_LOCATION.latitude + deltaLat,
      longitude: BASE_LOCATION.longitude + deltaLon,
    };
  }

  private pickDistanceBand(): { minKm: number; maxKm: number } {
    const bandIndex = faker.helpers.weightedArrayElement(
      DISTANCE_BANDS_KM.map(({ weight }, index) => ({ weight, value: index })),
    );
    const maxKm = DISTANCE_BANDS_KM[bandIndex].maxKm;
    const minKm = bandIndex === 0 ? 0 : DISTANCE_BANDS_KM[bandIndex - 1].maxKm;

    return { minKm, maxKm };
  }

  private async createPosts(count: number, users: UserEntity[], categories: CategoryEntity[]): Promise<PostEntity[]> {
    console.log('Creating posts...');

    const posts: PostEntity[] = [];

    for (let index = 0; index < count; index++) {
      const author = faker.helpers.arrayElement(users);
      const post = await this.createPostWithMetadata(author, categories, index);
      posts.push(post);
    }

    console.log(`Created ${posts.length} posts (with OpenGraph metadata)`);

    return posts;
  }

  private async createPostWithMetadata(
    author: UserEntity,
    categories: CategoryEntity[],
    index: number,
  ): Promise<PostEntity> {
    const post = this.postRepository.create(this.buildFakePost(author, categories, index));
    const savedPost = await this.postRepository.save(post);

    const metadata = this.openGraphRepository.create(this.buildFakeOpenGraphMetadata(savedPost));
    await this.openGraphRepository.save(metadata);

    return savedPost;
  }

  private buildFakePost(author: UserEntity, categories: CategoryEntity[], index: number): Partial<PostEntity> {
    const title = faker.lorem.sentence({ min: 3, max: 8 }).replace(/\.$/, '');
    const content = faker.lorem.paragraphs({ min: 2, max: 5 }, '\n\n');

    const createdAt = faker.date.recent({ days: 10 });

    const status = faker.helpers.weightedArrayElement([
      { weight: 7, value: PostStatus.PUBLISHED }, // 70% probability
      { weight: 2, value: PostStatus.DRAFT }, // 20% probability
      { weight: 1, value: PostStatus.ARCHIVED }, // 10% probability
    ]);

    return {
      title,
      content,
      slug: `${formatSlug(title)}-${index}`,
      status,
      viewCount: faker.number.int({ min: 0, max: 500 }),
      readingTimeMinutes: this.computeReadingTime(content),
      author,
      categories: faker.helpers.arrayElements(categories, { min: 1, max: categories.length }),
      updatedAt: createdAt,
      createdAt,
    };
  }

  private computeReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / AVERAGE_READING_SPEED_WPM));
  }

  private async createComments(posts: PostEntity[], users: UserEntity[]): Promise<void> {
    console.log('Creating comments...');

    const comments: CommentEntity[] = [];
    for (const post of posts) {
      const commentsCount = faker.number.int({ min: 0, max: MAX_COMMENTS_PER_POST });
      for (let i = 0; i < commentsCount; i++) {
        const commenter = faker.helpers.arrayElement(users);

        const createdAt = faker.date.recent({ days: 10 });

        comments.push(
          this.commentRepository.create({
            content: faker.lorem.sentences({ min: 1, max: 3 }),
            rating: faker.number.int({ min: 1, max: 5 }),
            postId: post.id,
            authorId: commenter.id,
            updatedAt: createdAt,
            createdAt,
          }),
        );
      }
    }

    if (comments.length === 0) {
      console.log('Created 0 comments');
      return;
    }

    await this.commentRepository.save(comments);

    for (const post of posts) {
      const postComments = comments.filter((comment) => comment.postId === post.id);
      if (postComments.length === 0) {
        continue;
      }

      const averageRating = postComments.reduce((sum, comment) => sum + comment.rating, 0) / postComments.length;
      await this.postRepository.update({ id: post.id }, { commentCount: postComments.length, averageRating });
    }

    console.log(`Created ${comments.length} comments`);
  }

  private buildFakeOpenGraphMetadata(post: PostEntity): Partial<OpenGraphMetadataEntity> {
    const type = faker.helpers.arrayElement(Object.values(OgType));

    return {
      title: post.title,
      description: faker.lorem.sentence(),
      type,
      image: faker.image.urlPicsumPhotos({ width: 320, height: 320 }),
      imageAlt: faker.lorem.words({ min: 2, max: 4 }),
      imageWidth: 320,
      imageHeight: 320,
      author: post.author.name,
      publisher: faker.company.name(),
      publishedTime: faker.date.past(),
      tags: faker.helpers.arrayElements(
        ['GraphQL', 'NestJS', 'API', 'TypeScript', 'Travel', 'Lifestyle', 'Tech', 'Guide'],
        { min: 2, max: 5 },
      ),
      locale: 'en_US',
      siteName: faker.company.name(),
      twitterCard: faker.helpers.arrayElement(['summary', 'summary_large_image', 'player']),
      twitterSite: `@${faker.internet.username()}`,
      twitterCreator: `@${faker.internet.username()}`,
      post,
      ...this.buildTypeSpecificMetadata(type),
    };
  }

  private buildTypeSpecificMetadata(type: OgType): Partial<OpenGraphMetadataEntity> {
    switch (type) {
      case OgType.VIDEO:
        return {
          videoUrl: faker.internet.url(),
          videoDuration: faker.number.int({ min: 60, max: 900 }),
          videoWidth: 1920,
          videoHeight: 1080,
        };
      case OgType.MUSIC:
        return {
          audioUrl: faker.internet.url(),
        };
      case OgType.PRODUCT:
        return {
          price: Number(faker.commerce.price({ min: 5, max: 500 })),
          currency: faker.finance.currencyCode(),
          availability: faker.helpers.arrayElement(['in stock', 'out of stock', 'preorder']),
        };
      case OgType.EVENT: {
        const eventStartTime = faker.date.future();
        return {
          eventStartTime,
          eventEndTime: faker.date.soon({ days: 1, refDate: eventStartTime }),
        };
      }
      default:
        return {};
    }
  }

  private logBreakdown(users: UserEntity[], posts: PostEntity[]): void {
    console.log('\n--- Seeding Breakdown ---');

    for (const user of users) {
      const userPosts = posts.filter((post) => post.author.id === user.id);
      const postTitles = userPosts.length > 0 ? userPosts.map((post) => `"${post.title}"`).join(', ') : '(no posts)';

      console.log(`User #${user.id} (${user.name}) owns ${userPosts.length} post(s): ${postTitles}`);
    }

    console.log('-------------------------');
  }
}
