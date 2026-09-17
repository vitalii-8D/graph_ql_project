export const SITE_NAME = 'Post Share';

/**
 * How many relation levels `getRequestedRelations` (src/utils/graphql-selection.util.ts) will descend for any
 * resolver. E.g. 5 means a query may eager-load `comments` (1) -> `comments.author` (2) -> `comments.author.posts`
 * (3) and so on; anything deeper is left to the per-field resolvers. Raising this multiplies the JOINs (and the
 * row fan-out) of a single query — kept as one shared cap so every domain's root queries behave consistently.
 */
export const MAX_RELATION_DEPTH = 5;
