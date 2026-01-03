import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: UsersService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
    password: 'password',
    posts: [],
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserInput: CreateUserInput = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await resolver.createUser(createUserInput);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserInput);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await resolver.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await resolver.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.findOne(1);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new NotFoundException('User with ID 999 not found'));

      await expect(resolver.findOne(999)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateUserInput: UpdateUserInput = {
        id: 1,
        name: 'Updated User',
      };

      const updatedUser = { ...mockUser, name: 'Updated User' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateUser(updateUserInput);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(updateUserInput);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const updateUserInput: UpdateUserInput = {
        id: 999,
        name: 'Updated User',
      };

      mockUsersService.update.mockRejectedValue(new NotFoundException('User with ID 999 not found'));

      await expect(resolver.updateUser(updateUserInput)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(updateUserInput);
    });
  });

  describe('removeUser', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue(mockUser);

      const result = await resolver.removeUser(1);

      expect(result).toEqual(mockUser);
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('User with ID 999 not found'));

      await expect(resolver.removeUser(999)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});
