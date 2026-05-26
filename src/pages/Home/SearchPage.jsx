import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toDetailPath } from './urlUtils';
import {
  FaSearch, FaTimes, FaStar, FaFilter, FaChevronDown,
} from 'react-icons/fa';
import { BiMoviePlay, BiTv, BiSliderAlt } from 'react-icons/bi';
import { MdOutlineTune } from 'react-icons/md';
import ContentCard from './ContentCard';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';
import { buildBrowsePath } from './urlFilters';
import SEO from './SEO';

const CONFIG = {
  API_KEY: import.meta.env.VITE_TMDB_API,
  BASE_URL: import.meta.env.VITE_BASE_URL,
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  DEBOUNCE_DELAY: 350,
};

const GRID_CLASSES = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mt-4';

const ALL_CATEGORIES = [
  ...GENRES.movie.map(g => ({ ...g, mediaType: 'movie', path: buildBrowsePath('movie', g.id, 'popularity.desc') })),
  ...GENRES.tv.map(g => ({ ...g, mediaType: 'tv', path: buildBrowsePath('tv', g.id, 'popularity.desc') })),
  ...SPECIAL_CATEGORIES.movie.map(g => ({ ...g, mediaType: 'movie', path: buildBrowsePath('movie', g.id, 'popularity.desc') })),
  ...SPECIAL_CATEGORIES.tv.map(g => ({ ...g, mediaType: 'tv', path: buildBrowsePath('tv', g.id, 'popularity.desc') })),
];

const UNIQUE_CATEGORIES = ALL_CATEGORIES.filter(
  (cat, idx, arr) => arr.findIndex(c => c.name === cat.name && c.mediaType === cat.mediaType) === idx
);

// ── Year options ──────────────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

// ── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popularity.desc' },
  { label: 'Top Rated', value: 'vote_average.desc' },
  { label: 'Newest First', value: 'release_date.desc' },
  { label: 'Oldest First', value: 'release_date.asc' },
];

// ── Rating presets ────────────────────────────────────────────────────────────
const RATING_OPTIONS = [
  { label: 'Any Rating', value: 0 },
  { label: '6+ Good', value: 6 },
  { label: '7+ Great', value: 7 },
  { label: '8+ Excellent', value: 8 },
  { label: '9+ Masterpiece', value: 9 },
];

// ── Default filters ───────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  mediaType: 'all',  // 'all' | 'movie' | 'tv'
  genreId: null,
  yearFrom: '',
  yearTo: '',
  minRating: 0,
  sortBy: 'popularity.desc',
};

const SkeletonGrid = ({ count = 14 }) => (
  <div className={GRID_CLASSES}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
    ))}
  </div>
);

const normalizeItems = (pages) => {
  const seen = new Set();
  const merged = [];
  for (const page of pages) {
    for (const item of page.results ?? []) {
      if (!item.poster_path) continue;
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const key = `${mediaType}_${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
};

const getNextPageParam = (lastPage, allPages) => {
  const maxPages = Math.min(lastPage.totalPages ?? 1, 500);
  const nextPage = allPages.length + 1;
  return nextPage <= maxPages ? nextPage : undefined;
};

// ── Chip component ─────────────────────────────────────────────────────────────
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 whitespace-nowrap
        ${active
          ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/25'
          : 'bg-white/[0.05] border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
        }`}
    >
      {children}
    </button>
  );
}

// ── Collapsible Select ─────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full bg-white/[0.06] border border-white/10 text-white text-xs font-medium px-3 py-2.5 pr-8 rounded-lg focus:outline-none focus:border-red-500/60 cursor-pointer transition-colors hover:border-white/20"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#141820] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] pointer-events-none" />
      <span className="absolute -top-2 left-2 bg-[#0a0c12] px-1 text-[10px] text-gray-500 font-medium">{label}</span>
    </div>
  );
}

// ── Active filter count badge ──────────────────────────────────────────────────
function countActiveFilters(filters) {
  let n = 0;
  if (filters.mediaType !== 'all') n++;
  if (filters.genreId !== null) n++;
  if (filters.yearFrom) n++;
  if (filters.yearTo) n++;
  if (filters.minRating > 0) n++;
  if (filters.sortBy !== 'popularity.desc') n++;
  return n;
}

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  const sentinelRef = useRef(null);

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Filter panel state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Genres list based on selected mediaType
  const genreList = useMemo(() => {
    if (filters.mediaType === 'movie') return [...GENRES.movie, ...SPECIAL_CATEGORIES.movie];
    if (filters.mediaType === 'tv') return [...GENRES.tv, ...SPECIAL_CATEGORIES.tv];
    // 'all' → merge deduplicated
    const seen = new Set();
    return [...GENRES.movie, ...SPECIAL_CATEGORIES.movie, ...GENRES.tv, ...SPECIAL_CATEGORIES.tv]
      .filter(g => { if (seen.has(g.name)) return false; seen.add(g.name); return true; });
  }, [filters.mediaType]);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const isSearching = debouncedQuery.trim().length > 0;
  const isBrowsing = !isSearching && activeFilterCount > 0;

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), CONFIG.DEBOUNCE_DELAY);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const next = debouncedQuery.trim();
    const current = searchParams.get('q') || '';
    if (next === current) return;
    const params = new URLSearchParams(searchParams);
    if (next) params.set('q', next);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, searchParams, setSearchParams]);

  // Reset genre when media type changes
  const setFilter = useCallback((key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'mediaType') next.genreId = null;
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // ── Build TMDB discover URL for browse mode ────────────────────────────────
  const buildBrowseUrl = useCallback((pageParam) => {
    const type = filters.mediaType === 'tv' ? 'tv' : 'movie';
    const url = new URL(`${CONFIG.BASE_URL}/discover/${type}`);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('page', pageParam);
    url.searchParams.append('include_adult', 'false');
    url.searchParams.append('language', 'en-US');

    // Sort
    const sortBy = filters.sortBy === 'release_date.desc' || filters.sortBy === 'release_date.asc'
      ? (type === 'tv'
          ? filters.sortBy.replace('release_date', 'first_air_date')
          : filters.sortBy.replace('release_date', 'primary_release_date'))
      : filters.sortBy;
    url.searchParams.append('sort_by', sortBy);

    // Min rating
    if (filters.minRating > 0) {
      url.searchParams.append('vote_average.gte', filters.minRating);
    }

    // Require a minimum vote count if sorting by rating or filtering by rating
    if (filters.minRating > 0 || filters.sortBy === 'vote_average.desc') {
      url.searchParams.append('vote_count.gte', '300'); // Filter out obscure 10/10 outliers
    } else if (filters.sortBy !== 'popularity.desc') {
      // For Newest/Oldest First, require at least some votes to weed out fake/obscure junk
      url.searchParams.append('vote_count.gte', '50');
    }

    // Year range
    const dateGteKey = type === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte';
    const dateLteKey = type === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte';
    
    if (filters.yearFrom) {
      url.searchParams.append(dateGteKey, `${filters.yearFrom}-01-01`);
    }

    if (filters.yearTo) {
      url.searchParams.append(dateLteKey, `${filters.yearTo}-12-31`);
    } else if (filters.sortBy === 'release_date.desc') {
      // If 'Newest First' is selected with no max year, cap it to today
      // This prevents seeing unreleased vaporware movies from the year 2031
      const today = new Date().toISOString().split('T')[0];
      url.searchParams.append(dateLteKey, today);
    }

    // Genre
    if (filters.genreId !== null && filters.genreId > 0) {
      url.searchParams.append('with_genres', filters.genreId);
    }

    return url.toString();
  }, [filters]);

  // ── Combined query key ─────────────────────────────────────────────────────
  const browseQueryKey = useMemo(() => [
    'browse',
    filters.mediaType,
    filters.genreId,
    filters.yearFrom,
    filters.yearTo,
    filters.minRating,
    filters.sortBy,
  ], [filters]);

  // ── Search query ───────────────────────────────────────────────────────────
  const searchQuery = useInfiniteQuery({
    queryKey: ['search-multi', debouncedQuery],
    enabled: isSearching,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const url = new URL(`${CONFIG.BASE_URL}/search/multi`);
      url.searchParams.append('api_key', CONFIG.API_KEY);
      url.searchParams.append('query', debouncedQuery);
      url.searchParams.append('page', pageParam);
      url.searchParams.append('include_adult', 'false');
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return {
        results: (data.results ?? []).filter(i => ['movie', 'tv'].includes(i.media_type)),
        totalPages: data.total_pages,
      };
    },
    getNextPageParam,
  });

  // ── Browse query (filters active, no search text) ──────────────────────────
  const browseQuery = useInfiniteQuery({
    queryKey: browseQueryKey,
    enabled: isBrowsing,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const url = buildBrowseUrl(pageParam);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Browse failed');
      const data = await res.json();
      const type = filters.mediaType === 'tv' ? 'tv' : 'movie';
      return {
        results: (data.results ?? []).map(i => ({ ...i, media_type: type })),
        totalPages: data.total_pages,
      };
    },
    getNextPageParam,
  });

  // ── Suggested (trending, no filters, no search) ────────────────────────────
  const suggestedQuery = useInfiniteQuery({
    queryKey: ['search-suggested-trending'],
    enabled: !isSearching && !isBrowsing,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const url = new URL(`${CONFIG.BASE_URL}/trending/all/week`);
      url.searchParams.append('api_key', CONFIG.API_KEY);
      url.searchParams.append('page', pageParam);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return {
        results: (data.results ?? []).filter(i => ['movie', 'tv'].includes(i.media_type)),
        totalPages: data.total_pages,
      };
    },
    getNextPageParam,
  });

  const activeQuery = isSearching ? searchQuery : isBrowsing ? browseQuery : suggestedQuery;
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } = activeQuery;
  const items = useMemo(() => normalizeItems(data?.pages ?? []), [data]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '220px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

  const matchedCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIQUE_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(q));
  }, [query]);

  const clearQuery = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  const showInitialLoading = isLoading && items.length === 0;
  const showLoadingMore = isFetchingNextPage && items.length > 0;
  const gridAnimationKey = isSearching
    ? debouncedQuery.trim().toLowerCase()
    : isBrowsing
      ? JSON.stringify(filters)
      : 'trending';

  // Section heading
  let sectionHeading = null;
  if (isSearching) {
    sectionHeading = (
      <h2 className="text-sm text-gray-400">
        Results for <span className="text-white font-semibold">"{debouncedQuery}"</span>
      </h2>
    );
  } else if (isBrowsing) {
    const parts = [];
    if (filters.mediaType !== 'all') parts.push(filters.mediaType === 'tv' ? 'TV Shows' : 'Movies');
    if (filters.genreId !== null) {
      const g = genreList.find(x => x.id === filters.genreId);
      if (g) parts.push(g.name);
    }
    if (filters.yearFrom && filters.yearTo) parts.push(`${filters.yearFrom}–${filters.yearTo}`);
    else if (filters.yearFrom) parts.push(`From ${filters.yearFrom}`);
    else if (filters.yearTo) parts.push(`Until ${filters.yearTo}`);
    if (filters.minRating > 0) parts.push(`${filters.minRating}+ Rating`);
    sectionHeading = (
      <h2 className="text-sm text-gray-400">
        Browsing: <span className="text-white font-semibold">{parts.join(' · ') || 'All Content'}</span>
      </h2>
    );
  } else {
    sectionHeading = <h2 className="text-lg font-semibold">Trending this week</h2>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-black text-white px-4 sm:px-8 pt-0 md:pt-10 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-16"
    >
      <SEO
        title={debouncedQuery ? `"${debouncedQuery}" - Search Results` : 'Search & Browse Movies & TV Shows'}
        description={
          debouncedQuery
            ? `Search results for "${debouncedQuery}" on WeFlix.`
            : 'Search and browse movies & TV shows by genre, year, and rating on WeFlix.'
        }
      />
      {/* Mobile-aware sticky top bar */}
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:pt-0 pb-3 md:pb-0 backdrop-blur-md bg-black/80 md:bg-transparent border-b border-white/[0.06] md:border-none mb-4 md:mb-0">
        <h1 className="text-2xl sm:text-3xl font-bold md:hidden">Search</h1>
      </div>
      <h1 className="hidden md:block text-3xl font-bold mb-6">Search</h1>

      {/* ── Search + Filter Toggle row ── */}
      <div className="flex gap-3 items-center max-w-3xl">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, genres..."
            className="w-full bg-gray-800/60 border border-gray-700/50 text-white pl-11 pr-10 py-3.5 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-500 transition-all duration-200"
          />
          {showInitialLoading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label="Clear"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`relative flex-shrink-0 flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all duration-200
            ${filtersOpen
              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
              : 'bg-gray-800/60 border-gray-700/50 text-gray-300 hover:border-gray-500 hover:text-white'
            }`}
          aria-label="Toggle filters"
        >
          <MdOutlineTune className="text-lg" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-black">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm max-w-3xl space-y-5">

              {/* Row 1: Media Type */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">Content Type</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All', value: 'all' },
                    { label: 'Movies', value: 'movie' },
                    { label: 'TV Shows', value: 'tv' },
                  ].map(opt => (
                    <Chip key={opt.value} active={filters.mediaType === opt.value} onClick={() => setFilter('mediaType', opt.value)}>
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Row 2: Genre chips */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">Genre</p>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto hide-scrollbar">
                  <Chip active={filters.genreId === null} onClick={() => setFilter('genreId', null)}>
                    All Genres
                  </Chip>
                  {genreList.filter(g => g.id > 0).map(g => (
                    <Chip key={g.id} active={filters.genreId === g.id} onClick={() => setFilter('genreId', g.id)}>
                      {g.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Row 3: Year + Rating + Sort */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FilterSelect
                  label="From Year"
                  value={filters.yearFrom}
                  onChange={v => setFilter('yearFrom', v)}
                  options={[
                    { label: 'Any', value: '' },
                    ...YEARS.map(y => ({ label: String(y), value: String(y) })),
                  ]}
                />
                <FilterSelect
                  label="To Year"
                  value={filters.yearTo}
                  onChange={v => setFilter('yearTo', v)}
                  options={[
                    { label: 'Any', value: '' },
                    ...YEARS.map(y => ({ label: String(y), value: String(y) })),
                  ]}
                />
                <FilterSelect
                  label="Min Rating"
                  value={filters.minRating}
                  onChange={v => setFilter('minRating', Number(v))}
                  options={RATING_OPTIONS.map(r => ({ label: r.label, value: r.value }))}
                />
                <FilterSelect
                  label="Sort By"
                  value={filters.sortBy}
                  onChange={v => setFilter('sortBy', v)}
                  options={SORT_OPTIONS.map(s => ({ label: s.label, value: s.value }))}
                />
              </div>

              {/* Row 4: Rating quick-pick pills */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5">
                  Rating Preset
                </p>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map(r => (
                    <Chip key={r.value} active={filters.minRating === r.value} onClick={() => setFilter('minRating', r.value)}>
                      {r.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Footer: active tags + reset */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <p className="text-xs text-gray-600">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                    : 'No filters active — showing trending'}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <FaTimes className="text-[10px]" /> Reset all
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-red-500 text-sm">{error.message}</p>}

      {/* ── Category shortcut chips (appear when typing a genre name) ── */}
      {matchedCategories.length > 0 && (
        <section className="mt-6">
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
                  : <BiTv className="text-red-400 shrink-0" />}
                {cat.name}
                <span className="text-[10px] text-gray-600 ml-0.5">
                  {cat.mediaType === 'movie' ? 'Movies' : 'TV'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Results ── */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
          {sectionHeading}
        </div>

        {items.length === 0 && showInitialLoading && <SkeletonGrid />}

        {items.length === 0 && !showInitialLoading && isSearching && (
          <p className="text-gray-500 mt-8 text-sm">No results found for "{debouncedQuery}"</p>
        )}

        {items.length === 0 && !showInitialLoading && isBrowsing && !isLoading && (
          <div className="mt-12 text-center">
            <BiSliderAlt className="text-gray-700 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No titles match your filters.</p>
            <button onClick={resetFilters} className="mt-4 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
              Clear filters
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className={GRID_CLASSES}>
            {items.map((item, index) => (
              <motion.div
                key={`${gridAnimationKey}-${item.media_type || 'movie'}-${item.id}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.26,
                  ease: 'easeOut',
                  delay: Math.min(index, 14) * 0.018,
                }}
              >
                <ContentCard
                  title={item.title || item.name}
                  poster={item.poster_path ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}` : ''}
                  rating={item.vote_average}
                  releaseDate={item.release_date || item.first_air_date}
                  onClick={() => {
                    const type = item.media_type === 'tv' ? 'tv' : 'movie';
                    const from = debouncedQuery.trim()
                      ? `/search?q=${encodeURIComponent(debouncedQuery.trim())}`
                      : '/search';
                    navigate(toDetailPath(type, item.id, item.title || item.name), { state: { from } });
                  }}
                  mediaId={item.id}
                  mediaType={item.media_type === 'tv' ? 'tv' : 'movie'}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                />
              </motion.div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} />

        {showLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="w-9 h-9 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>
    </motion.div>
  );
}

export default SearchPage;
