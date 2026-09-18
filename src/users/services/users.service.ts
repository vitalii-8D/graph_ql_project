import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { estypes } from '@elastic/elasticsearch';

import { ElasticsearchService } from '../../elasticsearch/services/elasticsearch.service';
import { ES_INDICES } from '../../elasticsearch/enums/indices';
import { UserSearchDocument } from '../../elasticsearch/mappings/users.mapping';
import { encodeCursor, decodeCursor } from '../../elasticsearch/utils/cursor.util';
import type { AuthenticatedUser } from '../../auth/types/common';
import { OrderDirection } from '../../enums/order-direction.enum';
import { PasswordUtil } from '../../utils/password.util';
import { RelationAwareService } from '../../utils/relation-aware.service';
import { sortByIds } from '../../utils/sort-by-ids';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { SearchUsersInput } from '../dto/search-users.input';
import { UserSearchResult } from '../dto/user-search-result.type';
import { UserEntity } from '../entities/user.entity';
import { UserIndexService } from './user-index.service';

const MAX_USERS_PER_PAGE = 100;
const DEFAULT_USERS_PER_PAGE = 20;

@Injectable()
export class UsersService extends RelationAwareService<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private readonly passwordUtil: PasswordUtil,
    private readonly userIndexService: UserIndexService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    super();
  }

  protected get repository(): Repository<UserEntity> {
    return this.usersRepository;
  }

  async create(createUserInput: CreateUserInput): Promise<UserEntity> {
    const hashedPassword = await this.passwordUtil.hash(createUserInput.password);

    const user = this.usersRepository.create({ ...createUserInput, password: hashedPassword });

    const savedUser = await this.usersRepository.save(user);
    await this.userIndexService.indexUser(savedUser);

    return savedUser;
  }

  async findAll(relations: string[] = [], limit = DEFAULT_USERS_PER_PAGE, offset = 0): Promise<UserEntity[]> {
    return await this.usersRepository.find({ relations, take: Math.min(limit, MAX_USERS_PER_PAGE), skip: offset });
  }

  async findByIdPlain(id: number): Promise<UserEntity | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async findOne(id: number, relations: string[] = []): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async search(
    input: SearchUsersInput,
    currentUser: AuthenticatedUser,
    relations: string[] = [],
  ): Promise<UserSearchResult> {
    const limit = input.limit ?? 10;

    const must: estypes.QueryDslQueryContainer[] = [];
    if (input.query) {
      must.push({
        multi_match: {
          query: input.query,
          fields: ['name^2', 'email', 'city'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    const filter: estypes.QueryDslQueryContainer[] = [];
    if (input.role) {
      filter.push({ term: { role: input.role } });
    }

    let originLat = input.latitude ?? 0;
    let originLon = input.longitude ?? 0;
    if (input.useMyLocation) {
      originLat = currentUser.latitude ?? 0;
      originLon = currentUser.longitude ?? 0;
    }

    const hasGeoFilter = input.radiusKm && originLat && originLon;
    if (hasGeoFilter) {
      filter.push({
        geo_distance: {
          distance: `${input.radiusKm!}km`,
          location: { lat: originLat, lon: originLon },
        },
      });
    }

    const sort: estypes.SortCombinations[] = [{ _score: { order: OrderDirection.DESC } }];
    if (hasGeoFilter) {
      sort.push({
        _geo_distance: { location: { lat: originLat, lon: originLon }, order: OrderDirection.ASC, unit: 'km' },
      });
    }
    sort.push({ lastActiveAt: { order: OrderDirection.DESC, missing: '_last' } }, { id: OrderDirection.ASC });

    const response = await this.elasticsearchService.search<UserSearchDocument>(ES_INDICES.Users, {
      query: {
        bool: {
          must,
          filter,
          must_not: [{ term: { id: currentUser.id } }],
        },
      },
      sort,
      size: limit,
      search_after: decodeCursor(input.cursor),
    });

    const hits = response.hits.hits;
    const ids = hits.map((hit) => Number(hit._id));
    const rows = ids.length > 0 ? await this.usersRepository.find({ where: { id: In(ids) }, relations }) : [];

    const items = sortByIds(ids, rows);

    const lastHit = hits[hits.length - 1];
    const nextCursor =
      hits.length === limit ? encodeCursor(lastHit?.sort as (string | number)[] | undefined) : undefined;

    return { items, nextCursor };
  }

  async update(updateUserInput: UpdateUserInput): Promise<UserEntity> {
    const user = await this.findOne(updateUserInput.id);
    const { password, ...rest } = updateUserInput;

    Object.assign(user, rest);
    if (password) {
      user.password = await this.passwordUtil.hash(password);
    }

    const savedUser = await this.usersRepository.save({ ...user, id: +user.id });
    await this.userIndexService.indexUser(savedUser);

    return savedUser;
  }

  async remove(id: number): Promise<UserEntity> {
    const user = await this.findOne(id);

    // repository.remove() nulls the entity's primary key on success — capture it first.
    await this.usersRepository.remove(user);
    await this.userIndexService.deleteUser(id);

    return { ...user, id };
  }

  async setOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const lastActiveAt = new Date();
    await this.usersRepository.update({ id }, { isOnline, lastActiveAt });
    await this.userIndexService.updateOnlineStatus(id, isOnline, lastActiveAt);
  }

  async findByIds(ids: number[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    return await this.usersRepository.findBy({ id: In(ids) });
  }
}
