import { Injectable, Scope } from '@nestjs/common';

// Shared by both ChatGateway (Socket.IO) and ChatSubscriptionsResolver (GraphQL subscriptions) to
// track per-room presence (roomId -> userId -> session ids), a "session id" being a socket id for
// the gateway or a per-subscription-attempt id for the resolver. Transient-scoped so each of those
// two consumers gets its own private instance/state - the two transports don't broadcast presence
// to each other's clients, so sharing one singleton instance would silently swallow a "joined"
// event on one transport whenever the same user is already present via the other.
@Injectable({ scope: Scope.TRANSIENT })
export class ChatPresenceTrackerService {
  private readonly roomPresence = new Map<number, Map<number, Set<string>>>();

  // Returns true only when this is the first active session the user has in the room, so a
  // second tab/subscription for the same user doesn't trigger a duplicate "joined" broadcast.
  trackJoin(roomId: number, userId: number, sessionId: string): boolean {
    let usersInRoom = this.roomPresence.get(roomId);
    if (!usersInRoom) {
      usersInRoom = new Map();
      this.roomPresence.set(roomId, usersInRoom);
    }

    let sessions = usersInRoom.get(userId);
    const isFirstSessionForUser = !sessions;
    if (!sessions) {
      sessions = new Set();
      usersInRoom.set(userId, sessions);
    }
    sessions.add(sessionId);

    return isFirstSessionForUser;
  }

  // Returns true only when this was the user's last active session in the room, so closing one
  // of several tabs/subscriptions doesn't trigger a premature "left" broadcast.
  trackLeave(roomId: number, userId: number, sessionId: string): boolean {
    const usersInRoom = this.roomPresence.get(roomId);
    const sessions = usersInRoom?.get(userId);
    if (!usersInRoom || !sessions) {
      return false;
    }

    sessions.delete(sessionId);
    if (sessions.size > 0) {
      return false;
    }

    usersInRoom.delete(userId);
    if (usersInRoom.size === 0) {
      this.roomPresence.delete(roomId);
    }

    return true;
  }
}
