import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async create(createPostInput: CreatePostInput): Promise<PostEntity> {
    const { authorId, categoryIds, ...postData } = createPostInput;

    const author = await this.usersRepository.findOne({
      where: { id: authorId },
    });
    if (!author) {
      throw new NotFoundException(`User with ID ${authorId} not found`);
    }

    let categories: CategoryEntity[] = [];
    if (categoryIds && categoryIds.length > 0) {
      categories = await this.categoriesRepository.findBy({
        id: In(categoryIds),
      });
    }

    const post = this.postsRepository.create({
      ...postData,
      author,
      categories,
    });

    return await this.postsRepository.save(post);
  }

  async findAll(): Promise<PostEntity[]> {
    return await this.postsRepository.find({
      relations: ['author', 'categories', 'openGraphMetadata'],
    });
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'categories', 'openGraphMetadata'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(updatePostInput: UpdatePostInput): Promise<PostEntity> {
    const { id, categoryIds, authorId, ...updateData } = updatePostInput;
    const post = await this.findOne(id);

    Object.assign(post, updateData);

    if (authorId) {
      const author = await this.usersRepository.findOne({
        where: { id: authorId },
      });
      if (!author) {
        throw new NotFoundException(`User with ID ${authorId} not found`);
      }
      post.author = author;
    }

    if (categoryIds) {
      post.categories = await this.categoriesRepository.findBy({
        id: In(categoryIds),
      });
    }

    return await this.postsRepository.save({ ...post, id: +post.id });
  }

  async remove(id: number): Promise<PostEntity> {
    const post = await this.findOne(id);
    await this.postsRepository.remove(post);
    return post;
  }
}
