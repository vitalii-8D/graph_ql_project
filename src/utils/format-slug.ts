export const formatSlug = (val: string): string =>
  val
    .trim()
    .replace(/[\s\W_]+/g, '-')
    .replace(/^-+|[^\w-]+|-+$/g, '')
    .toLowerCase();
