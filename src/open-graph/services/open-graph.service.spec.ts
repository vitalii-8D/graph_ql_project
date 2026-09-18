import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';

import { OpenGraphService } from './open-graph.service';
import { type OpenGraphMetadataEntity, OgType } from '../entities/open-graph-metadata.entity';
import { type PostEntity } from '../../posts/entities/post.entity';
import { PostStatus, PostPaymentStatus } from '../../posts/enums';
import { UserRole } from '../../users/enums';
import type { AuthenticatedUser } from '../../auth/types/common';

type MockRepository<T extends object = object> = { [K in keyof Repository<T>]?: jest.Mock };

function createMockRepository<T extends object>(): MockRepository<T> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((input: unknown) => input),
    save: jest.fn((input: unknown) => Promise.resolve(input)),
    remove: jest.fn((input: unknown) => Promise.resolve(input)),
  };
}

function makePost(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    id: 1,
    authorId: 10,
    status: PostStatus.PUBLISHED,
    paymentStatus: PostPaymentStatus.NOT_REQUIRED,
    ...overrides,
  } as PostEntity;
}

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 10, role: UserRole.USER, ...overrides } as AuthenticatedUser;
}

describe('OpenGraphService', () => {
  let service: OpenGraphService;
  let openGraphRepository: MockRepository<OpenGraphMetadataEntity>;
  let postRepository: MockRepository<PostEntity>;

  beforeEach(() => {
    openGraphRepository = createMockRepository<OpenGraphMetadataEntity>();
    postRepository = createMockRepository<PostEntity>();
    service = new OpenGraphService(
      openGraphRepository as unknown as Repository<OpenGraphMetadataEntity>,
      postRepository as unknown as Repository<PostEntity>,
    );
  });

  describe('createForPost', () => {
    it('throws NotFoundException when the post does not exist', async () => {
      postRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.createForPost(999, { title: 't', description: 'd', type: OgType.ARTICLE, locale: 'en_US' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a non-owner, non-admin caller', async () => {
      postRepository.findOne!.mockResolvedValue(makePost({ authorId: 10 }));
      const otherUser = makeUser({ id: 99 });

      await expect(
        service.createForPost(
          1,
          { title: 't', description: 'd', type: OgType.ARTICLE, locale: 'en_US' },
          otherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the owning user', async () => {
      postRepository.findOne!.mockResolvedValue(makePost({ authorId: 10 }));
      const owner = makeUser({ id: 10 });

      await expect(
        service.createForPost(1, { title: 't', description: 'd', type: OgType.ARTICLE, locale: 'en_US' }, owner),
      ).resolves.toBeDefined();
    });

    it('allows an admin acting on someone else\'s post', async () => {
      postRepository.findOne!.mockResolvedValue(makePost({ authorId: 10 }));
      const admin = makeUser({ id: 1, role: UserRole.ADMIN });

      await expect(
        service.createForPost(1, { title: 't', description: 'd', type: OgType.ARTICLE, locale: 'en_US' }, admin),
      ).resolves.toBeDefined();
    });

    it('skips the ownership check for trusted internal callers (no user passed)', async () => {
      postRepository.findOne!.mockResolvedValue(makePost({ authorId: 10 }));

      await expect(
        service.createForPost(1, { title: 't', description: 'd', type: OgType.ARTICLE, locale: 'en_US' }),
      ).resolves.toBeDefined();
    });
  });

  describe('findOne / findByPostId visibility', () => {
    it('returns metadata for a publicly-visible post to an anonymous caller', async () => {
      openGraphRepository.findOne!.mockResolvedValue({
        id: 1,
        post: makePost({ status: PostStatus.PUBLISHED, paymentStatus: PostPaymentStatus.NOT_REQUIRED }),
      });

      await expect(service.findOne(1)).resolves.toBeDefined();
    });

    it('hides metadata for a draft post from an anonymous caller (404, not a data leak)', async () => {
      openGraphRepository.findOne!.mockResolvedValue({
        id: 1,
        post: makePost({ status: PostStatus.DRAFT }),
      });

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('still shows a draft post to its own owner', async () => {
      openGraphRepository.findOne!.mockResolvedValue({
        id: 1,
        post: makePost({ status: PostStatus.DRAFT, authorId: 10 }),
      });

      await expect(service.findOne(1, makeUser({ id: 10 }))).resolves.toBeDefined();
    });

    it('returns null from findByPostId for a hidden post instead of throwing', async () => {
      openGraphRepository.findOne!.mockResolvedValue({
        id: 1,
        post: makePost({ status: PostStatus.DRAFT }),
      });

      await expect(service.findByPostId(1)).resolves.toBeNull();
    });
  });

  describe('upsertForPost', () => {
    it('updates existing metadata without requiring title/description', async () => {
      openGraphRepository.findOne!
        .mockResolvedValueOnce({ id: 5, post: makePost() }) // upsertForPost's existing-row lookup
        .mockResolvedValueOnce({ id: 5, post: makePost() }); // update()'s own lookup

      await expect(service.upsertForPost(1, { title: undefined, description: undefined })).resolves.toBeDefined();
    });

    // Regression for REL-8: creating brand-new metadata without a title/description used to
    // attempt an INSERT with undefined NOT NULL columns instead of failing fast and clearly.
    it('throws a clear error instead of a NOT NULL violation when no row exists yet and title/description are missing', async () => {
      openGraphRepository.findOne!.mockResolvedValue(null);

      await expect(service.upsertForPost(1, {})).rejects.toThrow(
        /Cannot create OpenGraph metadata for post 1 without a title\/description/,
      );
    });

    it('creates new metadata when title/description are present and no row exists yet', async () => {
      openGraphRepository.findOne!.mockResolvedValue(null);
      postRepository.findOne!.mockResolvedValue(makePost());

      await expect(service.upsertForPost(1, { title: 'T', description: 'D' })).resolves.toBeDefined();
    });
  });

  describe('update / remove ownership', () => {
    it('rejects updating another user\'s OpenGraph metadata', async () => {
      openGraphRepository.findOne!.mockResolvedValue({ id: 1, post: makePost({ authorId: 10 }) });

      await expect(
        service.update({ id: 1, title: 'x' }, makeUser({ id: 99 })),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects removing another user\'s OpenGraph metadata', async () => {
      openGraphRepository.findOne!.mockResolvedValue({ id: 1, post: makePost({ authorId: 10 }) });

      await expect(service.remove(1, makeUser({ id: 99 }))).rejects.toThrow(ForbiddenException);
    });
  });
});
