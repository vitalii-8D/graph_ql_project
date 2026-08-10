import { createHash } from 'crypto';

/**
 * Deterministic hash of a document's indexable fields, used by the reindex script to
 * skip documents that haven't changed since the last index (sorted keys so field order
 * never affects the hash).
 */
export function computeDocHash(fields: Record<string, unknown>): string {
  const sortedEntries = Object.keys(fields)
    .sort()
    .map((key) => [key, fields[key]] as const);
  return createHash('sha1').update(JSON.stringify(sortedEntries)).digest('hex');
}
