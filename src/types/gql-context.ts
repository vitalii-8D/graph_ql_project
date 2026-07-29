import { type Request, type Response } from 'express';
import { type AuthenticatedUser } from '../auth/types/common';

export interface IGqlContext {
  req: Request & { user?: AuthenticatedUser };
  res: Response;
}
