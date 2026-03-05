import { useState, forwardRef, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useMovie } from './MoviesContext';
import { useSeries } from './SeriesContext';

const CONFIG = {
  API_KEY: import.meta.env.VITE_TMDB_API,
  BASE_URL: import.meta.env.VITE_BASE_URL,
  DEBOUNCE_DELAY: 350,
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  BLUR_HASH_URL: 'https://image.tmdb.org/t/p/w100',
  MAX_RESULTS: 8
};

const ImageWithFallback = ({ src, alt, className }) => {
  const [imageState, setImageState] = useState({ isLoading: true, error: false });
  const imageSrc = src ? `${CONFIG.IMAGE_BASE_URL}${src}` : null;
  const blurSrc = src ? `${CONFIG.BLUR_HASH_URL}${src}` : null;
  
  const handleLoad = () => setImageState({ isLoading: false, error: false });
  const handleError = () => setImageState({ isLoading: false, error: true });
  
  return (
    <div className={`relative ${className} bg-gray-900`}>
      {imageState.isLoading && blurSrc && (
        <img
          src={blurSrc}
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-cover filter blur-md"
        />
      )}
      {!imageState.error && imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageState.isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
          <span className="text-xs">No Image</span>
        </div>
      )}
    </div>
  );
};

const ResultItem = memo(({ item, isSelected, onSelect, onHover }) => {
  const year = item.release_date && new Date(item.release_date).getFullYear();
  
  return (
    <div
      className={`flex items-center p-2 border-b border-slate-950 cursor-pointer transition-colors duration-200
        ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
      onMouseEnter={onHover}
      onClick={onSelect}
    >
      <ImageWithFallback
        src={item.poster_path}
        alt={item.title || item.name}
        className="w-16 h-24 rounded md:w-24 md:h-32"
      />
      <div className="ml-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white">{item.title || item.name}</h3>
        {item.vote_average && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Rating:</span>
            <span className="text-xs font-medium text-yellow-400">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
        )}
        <span className="text-xs text-gray-500 capitalize">{item.media_type}</span>
        {year && <span className="text-xs text-gray-400">{year}</span>}
      </div>
    </div>
  );
});

const SearchResults = memo(({ results, selectedIndex, onMouseEnter, onClick, variant }) => (
  <div className={`absolute z-50 mt-1 max-h-96 bg-black/95 backdrop-blur-sm rounded-lg overflow-y-auto shadow-2xl border border-gray-800
    ${ variant === 'sidebar'
        ? 'left-full top-0 ml-3 w-80'
        : 'w-full mt-2'
    }`}>
    {results.map((item, index) => (
      <ResultItem
        key={item.id}
        item={item}
        isSelected={selectedIndex === index}
        onHover={() => onMouseEnter(index)}
        onSelect={() => onClick(item)}
      />
    ))}
  </div>
));

const useSearchLogic = () => {
  const [state, setState] = useState({
    query: '',
    loading: false,
    results: [],
    selectedIndex: -1,
    error: null
  });
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastSuccessRef = useRef({ query: '', results: [] });

  const runMultiSearch = useCallback(async (searchQuery, signal) => {
    const url = new URL(`${CONFIG.BASE_URL}/search/multi`);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('query', searchQuery);
    url.searchParams.append('language', 'en-US');
    url.searchParams.append('page', '1');
    url.searchParams.append('include_adult', 'false');

    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    return (data.results ?? [])
      .filter(item => ['movie', 'tv'].includes(item.media_type))
      .slice(0, CONFIG.MAX_RESULTS);
  }, []);

  const runTypedSearch = useCallback(async (searchQuery, signal) => {
    const [tvResponse, movieResponse] = await Promise.all(
      ['tv', 'movie'].map(async (type) => {
        const url = new URL(`${CONFIG.BASE_URL}/search/${type}`);
        url.searchParams.append('api_key', CONFIG.API_KEY);
        url.searchParams.append('query', searchQuery);
        url.searchParams.append('language', 'en-US');
        url.searchParams.append('page', '1');
        url.searchParams.append('include_adult', 'false');

        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return (data.results ?? []).map(item => ({ ...item, media_type: type }));
      })
    );

    const merged = [...tvResponse, ...movieResponse];
    const deduped = [];
    const seen = new Set();
    for (const item of merged) {
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= CONFIG.MAX_RESULTS) break;
    }
    return deduped;
  }, []);

  const searchRequest = useCallback(async (searchQuery, signal) => {
    const normalized = searchQuery?.trim().replace(/\s+/g, ' ');
    if (!normalized) return [];

    const primary = await runMultiSearch(normalized, signal);
    if (primary.length > 0 || normalized.length < 4) return primary;

    const typedPrimary = await runTypedSearch(normalized, signal);
    if (typedPrimary.length > 0) return typedPrimary;

    const words = normalized.split(' ').filter(Boolean);
    const fallbackCandidates = [
      words.length > 1 ? words.slice(0, -1).join(' ').trim() : '',
      normalized.slice(0, -1).trim(),
      normalized.slice(0, -2).trim(),
    ].filter(Boolean);

    const tried = new Set([normalized]);
    for (const candidate of fallbackCandidates) {
      if (candidate.length < 3 || tried.has(candidate)) continue;
      tried.add(candidate);

      const fallback = await runMultiSearch(candidate, signal);
      if (fallback.length > 0) return fallback;

      const typedFallback = await runTypedSearch(candidate, signal);
      if (typedFallback.length > 0) return typedFallback;
    }

    const last = lastSuccessRef.current;
    if (last.results.length > 0 && normalized.startsWith(last.query)) {
      return last.results;
    }

    return primary;
  }, [runMultiSearch, runTypedSearch]);

  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (searchQuery, callback) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, CONFIG.DEBOUNCE_DELAY);
      return () => clearTimeout(timeoutId);
    };
  }, []);

  const handleSearch = useCallback(async (searchQuery) => {
    const normalized = searchQuery?.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      setState(prev => ({ ...prev, loading: false, results: [], selectedIndex: -1, error: null }));
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const results = await searchRequest(normalized, controller.signal);
      if (controller.signal.aborted || currentRequestId !== requestIdRef.current) return;

      if (results.length > 0) {
        lastSuccessRef.current = { query: normalized, results };
      }

      setState(prev => ({
        ...prev, 
        results,
        selectedIndex: -1,
        loading: false 
      }));
    } catch {
      if (controller.signal.aborted || currentRequestId !== requestIdRef.current) return;
      setState(prev => ({
        ...prev,
        error: 'Please check your internet connection.',
        results: [],
        loading: false
      }));
    }
  }, [searchRequest]);

  const cancelActiveSearch = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    state,
    setState,
    handleSearch,
    debouncedSearch,
    cancelActiveSearch
  };
};

const Search = forwardRef(({ onFocus, onBlur, isActive, variant = 'top' }, ref) => {
  const { selectMovie } = useMovie();
  const { selectSeries } = useSeries();
  const { state, setState, handleSearch, debouncedSearch, cancelActiveSearch } = useSearchLogic();
  const { query, loading, results, selectedIndex, error } = state;

  const clearSearch = useCallback(() => {
    cancelActiveSearch();
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      selectedIndex: -1,
      error: null
    }));
  }, [cancelActiveSearch, setState]);

  const handleKeyNavigation = useCallback((e) => {
    if (results.length === 0) return;

    const keyHandlers = {
      ArrowDown: () => {
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, results.length - 1)
        }));
      },
      ArrowUp: () => {
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0)
        }));
      },
      Enter: () => {
        if (selectedIndex >= 0) {
          const selectedItem = results[selectedIndex];
          const handler = selectedItem.media_type === 'movie' ? selectMovie : selectSeries;
          handler(selectedItem);
          clearSearch();
        }
      },
      Escape: clearSearch
    };

    const handler = keyHandlers[e.key];
    if (handler) handler();
  }, [results, selectedIndex, selectMovie, selectSeries, clearSearch, setState]);

  useEffect(() => {
    if (query) {
      const cleanup = debouncedSearch(query, () => handleSearch(query));
      return cleanup;
    }
  }, [query, debouncedSearch, handleSearch]);

  const searchInputClasses = useMemo(() => `
    w-full text-white px-4 py-2 rounded-lg text-sm
    focus:outline-none focus:ring-2 focus:ring-red-600 transition-all duration-200
    ${variant === 'sidebar' ? 'bg-gray-800/80 placeholder-gray-500' : 'bg-gray-800 px-6 py-1.5 rounded-full'}
    ${isActive && variant !== 'sidebar' ? 'ring-2 ring-white' : ''}
  `, [isActive, variant]);

  if (variant === 'sidebar') {
    return (
      <div className="relative w-full px-3 py-2">
        <div className="relative">
          <FaSearch className="absolute left-3 top-2.5 text-gray-500 text-xs pointer-events-none" />
          <input
            ref={ref}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setState(prev => ({ ...prev, query: e.target.value }))}
            onKeyDown={handleKeyNavigation}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus
            className="w-full bg-gray-800/80 text-white text-sm pl-8 pr-7 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-500 transition-all duration-200"
            aria-label="Search for movies and TV shows"
          />
          {loading && (
            <div className="absolute right-2 top-2.5">
              <div className="animate-spin h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full" />
            </div>
          )}
          {query && !loading && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-2.5 text-gray-500 hover:text-white transition-colors duration-200"
              aria-label="Clear search"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
        {results.length > 0 && (
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onMouseEnter={index => setState(prev => ({ ...prev, selectedIndex: index }))}
            onClick={item => {
              const handler = item.media_type === 'movie' ? selectMovie : selectSeries;
              handler(item);
              clearSearch();
            }}
            variant="sidebar"
          />
        )}
        {error && (
          <p className="mt-1 text-red-500 text-xs px-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-black/90 w-full px-2 py-2">
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          <input
            ref={ref}
            type="text"
            placeholder="Search movies and TV shows..."
            value={query}
            onChange={e => setState(prev => ({ ...prev, query: e.target.value }))}
            onKeyDown={handleKeyNavigation}
            onFocus={onFocus}
            onBlur={onBlur}
            className={searchInputClasses}
            aria-label="Search for movies and TV shows"
            aria-live="polite"
          />
          <FaSearch className="absolute right-10 top-2 text-gray-400 text-sm" />
          {loading && (
            <div className="absolute right-12 top-2">
              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
            </div>
          )}
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2 text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
          {error && (
            <p className="absolute -bottom-6 left-0 text-red-500 text-xs">{error}</p>
          )}
        </div>
        {results.length > 0 && (
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onMouseEnter={index => setState(prev => ({ ...prev, selectedIndex: index }))}
            onClick={item => {
              const handler = item.media_type === 'movie' ? selectMovie : selectSeries;
              handler(item);
              clearSearch();
            }}
            variant={variant}
          />
        )}
      </div>
    </div>
  );
});

const itemPropType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string,
  name: PropTypes.string,
  poster_path: PropTypes.string,
  vote_average: PropTypes.number,
  media_type: PropTypes.string.isRequired,
  release_date: PropTypes.string
});

ImageWithFallback.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
};

ResultItem.propTypes = {
  item: itemPropType.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onHover: PropTypes.func.isRequired
};

SearchResults.propTypes = {
  results: PropTypes.arrayOf(itemPropType).isRequired,
  selectedIndex: PropTypes.number.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['top', 'sidebar'])
};

Search.propTypes = {
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  isActive: PropTypes.bool,
  variant: PropTypes.oneOf(['top', 'sidebar']),
};

Search.displayName = 'Search';
ResultItem.displayName = 'ResultItem';
SearchResults.displayName = 'SearchResults';

export default Search;