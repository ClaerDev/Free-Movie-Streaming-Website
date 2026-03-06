import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'WeFlix';
const SITE_URL  = import.meta.env.VITE_SITE_URL || 'https://www.weflix.app';
const DEFAULT_IMAGE = `${SITE_URL}/weflix2.png`;

/**
 * Reusable SEO component.
 *
 * Props:
 *  title        – page title (appended with " | WeFlix" unless noSuffix)
 *  description  – meta description (max ~160 chars)
 *  image        – absolute OG image URL
 *  url          – canonical URL (defaults to current href)
 *  type         – OG type: 'website' | 'video.movie' | 'video.episode'
 *  noSuffix     – if true, title is used exactly as given
 *  jsonLd       – raw JSON-LD object to embed as structured data
 */
export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noSuffix = false,
  jsonLd,
}) {
  const fullTitle = title
    ? noSuffix ? title : `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Movie & TV Streaming`;

  const metaDescription =
    description ||
    'Discover and stream trending movies and TV shows. Browse by genre, search titles, and watch instantly — powered by TMDB.';

  const metaImage  = image  || DEFAULT_IMAGE;
  const canonical  = (() => {
    const raw = url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
    try {
      const parsed = new URL(raw);
      const preferred = new URL(SITE_URL);
      parsed.protocol = preferred.protocol;
      parsed.hostname = preferred.hostname;
      parsed.port = '';
      parsed.hash = '';
      return parsed.toString();
    } catch {
      return SITE_URL;
    }
  })();

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image"       content={metaImage} />
      <meta property="og:image:alt"   content={fullTitle} />
      <meta property="og:url"         content={canonical} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image"       content={metaImage} />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
