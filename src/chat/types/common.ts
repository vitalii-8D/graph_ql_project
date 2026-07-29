import type { Socket } from 'socket.io';
import type { AuthenticatedUser } from '../../auth/types/common';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedUser;
  };
}
