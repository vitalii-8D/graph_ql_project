import { Injectable } from '@nestjs/common';

const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Minimal, in-memory de-duplication for `incrementPostViewCount` — not a substitute for real
 * rate limiting (no infra to back it, and it forgets everything on restart), but it closes the
 * "one click == N views" gap without introducing new dependencies.
 */
@Injectable()
export class ViewCountDedupeService {
  private readonly recentViews = new Map<string, number>();

  shouldCount(postId: number, clientIp: string): boolean {
    const key = `${postId}:${clientIp}`;
    const now = Date.now();
    const expiresAt = this.recentViews.get(key);

    if (expiresAt && expiresAt > now) {
      return false;
    }

    this.recentViews.set(key, now + VIEW_DEDUPE_WINDOW_MS);
    this.pruneExpired(now);
    return true;
  }

  private pruneExpired(now: number): void {
    for (const [key, expiresAt] of this.recentViews) {
      if (expiresAt <= now) {
        this.recentViews.delete(key);
      }
    }
  }
}
