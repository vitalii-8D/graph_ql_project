import { Test, TestingModule } from '@nestjs/testing';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { NotFoundException } from '@nestjs/common';

describe('PostsResolver', () => {
  let resolver: PostsResolver;
  let service: PostsService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
  };

  const mockCategory = {
    id: 1,
    name: 'Technology',
    description: 'Tech posts',
  };

  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    content: 'This is a test post',
    published: true,
    author: mockUser as any,
    categories: [mockCategory as any],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPostsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsResolver,
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    resolver = module.get<PostsResolver>(PostsResolver);
    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const createPostInput: CreatePostInput = {
        title: 'Test Post',
        content: 'This is a test post',
        published: true,
        authorId: 1,
        categoryIds: [1],
      };

      mockPostsService.create.mockResolvedValue(mockPost);

      const result = await resolver.createPost(createPostInput);

      expect(result).toEqual(mockPost);
      expect(service.create).toHaveBeenCalledWith(createPostInput);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when author does not exist', async () => {
      const createPostInput: CreatePostInput = {
        title: 'Test Post',
        content: 'This is a test post',
        published: true,
        authorId: 999,
        categoryIds: [1],
      };

      mockPostsService.create.mockRejectedValue(new NotFoundException('User with ID 999 not found'));

      await expect(resolver.createPost(createPostInput)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith(createPostInput);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      const posts = [mockPost];
      mockPostsService.findAll.mockResolvedValue(posts);

      const result = await resolver.findAll();

      expect(result).toEqual(posts);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no posts exist', async () => {
      mockPostsService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a post by id', async () => {
      mockPostsService.findOne.mockResolvedValue(mockPost);

      const result = await resolver.findOne(1);

      expect(result).toEqual(mockPost);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when post is not found', async () => {
      mockPostsService.findOne.mockRejectedValue(new NotFoundException('Post with ID 999 not found'));

      await expect(resolver.findOne(999)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const updatePostInput: UpdatePostInput = {
        id: 1,
        title: 'Updated Post',
      };

      const updatedPost = { ...mockPost, title: 'Updated Post' };
      mockPostsService.update.mockResolvedValue(updatedPost);

      const result = await resolver.updatePost(updatePostInput);

      expect(result).toEqual(updatedPost);
      expect(service.update).toHaveBeenCalledWith(updatePostInput);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when updating non-existent post', async () => {
      const updatePostInput: UpdatePostInput = {
        id: 999,
        title: 'Updated Post',
      };

      mockPostsService.update.mockRejectedValue(new NotFoundException('Post with ID 999 not found'));

      await expect(resolver.updatePost(updatePostInput)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(updatePostInput);
    });
  });

  describe('removePost', () => {
    it('should remove a post', async () => {
      mockPostsService.remove.mockResolvedValue(mockPost);

      const result = await resolver.removePost(1);

      expect(result).toEqual(mockPost);
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when removing non-existent post', async () => {
      mockPostsService.remove.mockRejectedValue(new NotFoundException('Post with ID 999 not found'));

      await expect(resolver.removePost(999)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});
