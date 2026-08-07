import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { estypes } from '@elastic/elasticsearch';

import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { ES_INDICES } from '../elasticsearch/indices';
import { UserSearchDocument } from '../elasticsearch/mappings/users.mapping';
import { encodeCursor, decodeCursor } from '../elasticsearch/cursor.util';
import type { AuthenticatedUser } from '../auth/types/common';
import { PasswordUtil } from '../utils/password.util';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { SearchUsersInput } from './dto/search-users.input';
import { UserSearchResult } from './dto/user-search-result.type';
import { UserEntity } from './entities/user.entity';
import { UserIndexService } from './user-index.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private readonly passwordUtil: PasswordUtil,
    private readonly userIndexService: UserIndexService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<UserEntity> {
    const hashedPassword = await this.passwordUtil.hash(createUserInput.password);

    const user = this.usersRepository.create({ ...createUserInput, password: hashedPassword });

    const savedUser = await this.usersRepository.save(user);
    await this.userIndexService.indexUser(savedUser);

    return savedUser;
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.usersRepository.find();
  }

  async findByIdPlain(id: number): Promise<UserEntity | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
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

  async searchViaElasticsearch(input: SearchUsersInput, currentUser: AuthenticatedUser): Promise<UserSearchResult> {
    const limit = input.limit ?? 10;

    const must: estypes.QueryDslQueryContainer[] = input.query
      ? [
          {
            multi_match: {
              query: input.query,
              fields: ['name^2', 'email', 'city'],
              fuzziness: 'AUTO',
            },
          },
        ]
      : [{ match_all: {} }];

    const filter: estypes.QueryDslQueryContainer[] = [];
    if (input.role) {
      filter.push({ term: { role: input.role } });
    }

    const originLat = input.latitude ?? (input.useMyLocation ? currentUser.latitude : undefined);
    const originLon = input.longitude ?? (input.useMyLocation ? currentUser.longitude : undefined);
    const hasGeoFilter = input.radiusKm != null && originLat != null && originLon != null;

    if (hasGeoFilter) {
      filter.push({
        geo_distance: {
          distance: `${input.radiusKm!}km`,
          location: { lat: originLat, lon: originLon },
        },
      });
    }

    const sort: estypes.SortCombinations[] = [{ _score: { order: 'desc' } }];
    if (hasGeoFilter) {
      sort.push({ _geo_distance: { location: { lat: originLat, lon: originLon }, order: 'asc', unit: 'km' } });
    }
    sort.push({ lastActiveAt: { order: 'desc', missing: '_last' } }, { id: 'asc' });

    const response = await this.elasticsearchService.search<UserSearchDocument>(ES_INDICES.users, {
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
    const rows = ids.length > 0 ? await this.usersRepository.findBy({ id: In(ids) }) : [];
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const items = ids.map((id) => rowsById.get(id)).filter((row): row is UserEntity => Boolean(row));

    const lastHit = hits[hits.length - 1];
    const nextCursor = hits.length === limit ? encodeCursor(lastHit?.sort as (string | number)[] | undefined) : undefined;

    return { items, nextCursor };
  }

  async update(updateUserInput: UpdateUserInput): Promise<UserEntity> {
    const user = await this.findOne(updateUserInput.id);

    Object.assign(user, updateUserInput);

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
