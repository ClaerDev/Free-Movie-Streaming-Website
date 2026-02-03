import { useState, forwardRef, useEffect, useCallback, useMemo , memo } from 'react';
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

const SearchResults = memo(({ results, selectedIndex, onMouseEnter, onClick }) => (
  <div className="absolute z-10 mt-2 max-h-60 w-full bg-black/95 backdrop-blur-sm rounded-lg overflow-y-auto shadow-lg border border-gray-800">
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

  const searchRequest = useCallback(async (searchQuery) => {
    if (!searchQuery?.trim()) return [];
    
    const url = new URL(`${CONFIG.BASE_URL}/search/multi`);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('query', searchQuery);
    url.searchParams.append('language', 'en-US');
    url.searchParams.append('page', '1');
    url.searchParams.append('include_adult', 'false');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data.results
      .filter(item => ['movie', 'tv'].includes(item.media_type))
      .slice(0, CONFIG.MAX_RESULTS);
  }, []);

  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (searchQuery, callback) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, CONFIG.DEBOUNCE_DELAY);
      return () => clearTimeout(timeoutId);
    };
  }, []);

  const handleSearch = useCallback(async (searchQuery) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const results = await searchRequest(searchQuery);
      setState(prev => ({ 
        ...prev, 
        results,
        selectedIndex: -1,
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Please check your internet connection.',
        results: [],
        loading: false
      }));
    }
  }, [searchRequest]);

  return {
    state,
    setState,
    handleSearch,
    debouncedSearch
  };
};

const Search = forwardRef(({ onFocus, onBlur, isActive }, ref) => {
  const { selectMovie } = useMovie();
  const { selectSeries } = useSeries();
  const { state, setState, handleSearch, debouncedSearch } = useSearchLogic();
  const { query, loading, results, selectedIndex, error } = state;

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      selectedIndex: -1,
      error: null
    }));
  }, [setState]);

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
    w-full bg-gray-800 text-white px-6 py-1.5 rounded-full text-sm
    focus:outline-none focus:ring-2 focus:ring-red-600 transition-all duration-200
    ${isActive ? 'ring-2 ring-white' : ''}
  `, [isActive]);

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
  onClick: PropTypes.func.isRequired
};

Search.propTypes = {
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  isActive: PropTypes.bool,
};

Search.displayName = 'Search';
ResultItem.displayName = 'ResultItem';
SearchResults.displayName = 'SearchResults';

export default Search;