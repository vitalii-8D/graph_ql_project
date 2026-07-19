import { type UserEntity } from '../users/entities/user.entity';

export interface JwtPayload {
  id: number;
  email: string;
}

export type AuthenticatedUser = Omit<UserEntity, 'password' | 'posts'>;
