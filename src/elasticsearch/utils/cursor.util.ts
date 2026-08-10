/**
 * Opaque `search_after` cursor: base64-encoded JSON of the last hit's raw ES `sort` values.
 * ES's search_after pagination is forward-only by design, hence no matching "decode a
 * previous-page cursor" helper — callers can only ever move forward.
 */
export function encodeCursor(sortValues: (string | number)[] | undefined | null): string | undefined {
  if (!sortValues) return undefined;
  return Buffer.from(JSON.stringify(sortValues)).toString('base64');
}

export function decodeCursor(cursor: string | undefined | null): (string | number)[] | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    return Array.isArray(parsed) ? (parsed as (string | number)[]) : undefined;
  } catch {
    return undefined;
  }
}
