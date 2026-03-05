/**
 * Convert a title string into a URL-safe slug.
 * e.g. "Fight Club" -> "fight-club"
 */
export function toSlug(title = '') {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-');           // collapse multiple hyphens
}

/**
 * Build a detail page path with a human-readable slug.
 * e.g. toDetailPath('movie', 550, 'Fight Club') -> '/movie/550-fight-club'
 */
export function toDetailPath(type, id, title) {
  const slug = toSlug(title);
  return slug ? `/${type}/${id}-${slug}` : `/${type}/${id}`;
}
