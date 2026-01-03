import { Controller, Get, Param, Render, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsWebController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Render('posts/index')
  async index() {
    const posts = await this.postsService.findAll();
    return {
      title: 'Social Sharing Test - All Posts',
      description: 'Test pages for social sharing with OpenGraph metadata',
      posts,
      layout: 'layouts/main',
    };
  }

  @Get(':id')
  @Render('posts/show')
  async show(@Param('id') id: string) {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      throw new NotFoundException('Invalid post ID');
    }

    const post = await this.postsService.findOne(postId);

    // Prepare OpenGraph data with dynamic URL and mock image
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const og = post.openGraphMetadata
      ? {
          ...post.openGraphMetadata,
          url: `${serverUrl}/posts/${post.id}`,
          image: 'https://cataas.com/cat?type=square&position=center&width=320&height=320',
          imageAlt: 'cat',
          imageWidth: 320,
          imageHeight: 320,
        }
      : null;

    return {
      title: og?.title || post.title,
      description: og?.description || post.content.substring(0, 200),
      og,
      post: {
        ...post,
        openGraphMetadata: og,
      },
      layout: 'layouts/main',
    };
  }
}
