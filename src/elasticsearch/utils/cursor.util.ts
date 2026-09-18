// When a sort field is missing on a doc (e.g. a `missing: '_last'`/'_first' numeric or date sort),
// ES substitutes its internal Long.MIN_VALUE/MAX_VALUE (±9223372036854775808) as that doc's raw
// sort value. That's well outside the range a JS double can represent exactly, so round-tripping
// it through JSON.stringify/parse rounds it to a nearby value ES then rejects when it's replayed
// as `search_after` against a date field (`parse_exception: failed to parse date field
// [-9223372036854776000] ...`). Clamping to the nearest *safe* integer keeps it usable purely as
// a sort boundary — still smaller/larger than any real value ES would produce — without the
// lossy round-trip.
function sanitizeSortValue(value: string | number): string | number {
  if (typeof value !== 'number' || Number.isSafeInteger(value)) {
    return value;
  }
  return value < 0 ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
}

/**
 * Opaque `search_after` cursor: base64-encoded JSON of the last hit's raw ES `sort` values.
 * ES's search_after pagination is forward-only by design, hence no matching "decode a
 * previous-page cursor" helper — callers can only ever move forward.
 */
export function encodeCursor(sortValues: (string | number)[] | undefined | null): string | undefined {
  if (!sortValues) return undefined;
  return Buffer.from(JSON.stringify(sortValues.map(sanitizeSortValue))).toString('base64');
}

export function decodeCursor(cursor: string | undefined | null): (string | number)[] | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    return Array.isArray(parsed) ? (parsed as (string | number)[]).map(sanitizeSortValue) : undefined;
  } catch {
    return undefined;
  }
}
