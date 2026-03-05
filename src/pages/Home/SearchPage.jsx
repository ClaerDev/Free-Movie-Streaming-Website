import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toDetailPath } from './urlUtils';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { BiMoviePlay, BiTv } from 'react-icons/bi';
import ContentCard from './ContentCard';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';

const CONFIG = {
  API_KEY: import.meta.env.VITE_TMDB_API,
  BASE_URL: import.meta.env.VITE_BASE_URL,
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  DEBOUNCE_DELAY: 350,
  MAX_RESULTS: 40,
};

const GRID_CLASSES = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 mt-4';

// Build a flat list of all genres/categories with their nav destination
const ALL_CATEGORIES = [
  ...GENRES.movie.map(g => ({ ...g, mediaType: 'movie', path: `/movies?genre=${g.id}` })),
  ...GENRES.tv.map(g => ({ ...g, mediaType: 'tv', path: `/series?genre=${g.id}` })),
  ...SPECIAL_CATEGORIES.movie.map(g => ({ ...g, mediaType: 'movie', path: `/movies?genre=${g.id}` })),
  ...SPECIAL_CATEGORIES.tv.map(g => ({ ...g, mediaType: 'tv', path: `/series?genre=${g.id}` })),
];

// Deduplicate by name+mediaType
const UNIQUE_CATEGORIES = ALL_CATEGORIES.filter(
  (cat, idx, arr) => arr.findIndex(c => c.name === cat.name && c.mediaType === cat.mediaType) === idx
);

// ─── Suggested grid (popular movies) ────────────────────────────────────────

const SuggestedGrid = ({ onSelect }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url = new URL(`${CONFIG.BASE_URL}/movie/popular`);
        url.searchParams.append('api_key', CONFIG.API_KEY);
        url.searchParams.append('language', 'en-US');
        url.searchParams.append('page', '1');
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) setItems(data.results?.slice(0, 20) ?? []);
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg bg-gray-800/70 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {items.map(item => (
        <ContentCard
          key={item.id}
          title={item.title || item.name}
          poster={item.poster_path ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}` : ''}
          rating={item.vote_average}
          releaseDate={item.release_date}
          onClick={() => onSelect({ ...item, media_type: 'movie' })}
        />
      ))}
    </div>
  );
};

// ─── Search results grid ─────────────────────────────────────────────────────

const ResultsGrid = ({ results, onSelect }) => (
  <div className={GRID_CLASSES}>
    {results.map(item => (
      <ContentCard
        key={item.id}
        title={item.title || item.name}
        poster={item.poster_path ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}` : ''}
        rating={item.vote_average}
        releaseDate={item.release_date}
        onClick={() => onSelect(item)}
      />
    ))}
  </div>
);

// ─── Main SearchPage ──────────────────────────────────────────────────────────

function SearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Auto-focus search bar on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${CONFIG.BASE_URL}/search/multi`);
      url.searchParams.append('api_key', CONFIG.API_KEY);
      url.searchParams.append('query', q);
      url.searchParams.append('language', 'en-US');
      url.searchParams.append('page', '1');
      url.searchParams.append('include_adult', 'false');
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setResults(
        data.results
          .filter(i => ['movie', 'tv'].includes(i.media_type))
          .slice(0, CONFIG.MAX_RESULTS)
      );
    } catch {
      setError('Could not load results. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => doSearch(query), CONFIG.DEBOUNCE_DELAY);
    return () => clearTimeout(id);
  }, [query, doSearch]);

  const handleSelect = useCallback((item) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    navigate(toDetailPath(type, item.id, item.title || item.name));
  }, [navigate]);

  // Match categories by name
  const matchedCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIQUE_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(q));
  }, [query]);

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const showSuggested = !query.trim() && !loading;
  const showResults  = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-black text-white px-8 pt-10 pb-16">
      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6">Search</h1>

      {/* Search bar */}
      <div className="relative max-w-2xl">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies, TV shows, genres…"
          className="w-full bg-gray-800/60 border border-gray-700/50 text-white pl-11 pr-10 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-500 transition-all duration-200"
        />
        {loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

      {/* Suggested section */}
      {showSuggested && (
        <section className="mt-8">
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
              Suggested for You
            </h2>
          </div>
          <SuggestedGrid onSelect={handleSelect} />
        </section>
      )}

      {/* Category chips */}
      {matchedCategories.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
            <h2 className="text-sm font-semibold text-gray-300">Browse by Category</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedCategories.map(cat => (
              <button
                key={`${cat.mediaType}-${cat.id}`}
                onClick={() => navigate(cat.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/[0.07] border border-white/10 text-gray-300 hover:bg-red-600/20 hover:border-red-500/40 hover:text-white transition-all duration-150"
              >
                {cat.mediaType === 'movie'
                  ? <BiMoviePlay className="text-red-400 shrink-0" />
                  : <BiTv className="text-red-400 shrink-0" />
                }
                {cat.name}
                <span className="text-[10px] text-gray-600 ml-0.5">
                  {cat.mediaType === 'movie' ? 'Movies' : 'TV'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Search results */}
      {showResults && (
        <section className="mt-8">
          {results.length > 0 ? (
            <>
              <h2 className="text-sm text-gray-400 mb-1">
                {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
              </h2>
              <ResultsGrid results={results} onSelect={handleSelect} />
            </>
          ) : !loading ? (
            <p className="text-gray-500 mt-8 text-sm">No results found for &ldquo;{query}&rdquo;</p>
          ) : null}
        </section>
      )}
    </div>
  );
}

export default SearchPage;
