import { type Request, type Response } from 'express';
import { type AuthenticatedUser } from '../auth/types';

export interface IGqlContext {
  req: Request & { user?: AuthenticatedUser };
  res: Response;
}
