import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import ContentCard from './ContentCard';
import { fetchContentByGenre } from './Fetcher';
import { BiWifi } from 'react-icons/bi';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const MAX_PAGES = 500;

const ErrorWarning = () => (
  <div className="flex flex-col items-center justify-center space-y-2 p-4  max-w-xs mx-auto">
    <div className="relative">
      
      <BiWifi className="text-red-400 w-6 h-10 absolute -top-1 mb-5 -right-1 animate-bounce" />
    </div>
    <div className="text-center space-y-1">
      <h3 className="text-red-700 mt-6 text-md font-bold">Connection Error</h3>
      
    </div>
    
  </div>
);

const ContentGrid = ({ genreId, type, onSelect }) => {
  const [state, setState] = useState({
    content: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
    uniqueIds: new Set(),
  });

  const loadingRef = useRef(false);
  const observerRef = useRef(null);
  const lastElementRef = useRef(null);

  const loadContent = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return;
    loadingRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const newContent = await fetchContentByGenre(type, genreId, state.page);
      const uniqueContent = newContent.filter((item) => {
        if (state.uniqueIds.has(item.id)) return false;
        state.uniqueIds.add(item.id);
        return true;
      });

      setState((prev) => ({
        ...prev,
        content: [...prev.content, ...uniqueContent],
        hasMore: uniqueContent.length > 0 && prev.page < MAX_PAGES,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [genreId, type, state.page, state.uniqueIds]);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loadingRef.current && state.hasMore) {
        setState((prev) => ({
          ...prev,
          page: Math.min(prev.page + 1, MAX_PAGES),
        }));
      }
    },
    [state.hasMore]
  );

  useEffect(() => {
    setState({
      content: [],
      loading: false,
      error: null,
      page: 1,
      hasMore: true,
      uniqueIds: new Set(),
    });
  }, [genreId, type]);

  useEffect(() => {
    loadContent();
  }, [loadContent, state.page]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    const currentElement = lastElementRef.current;
    const currentObserver = observerRef.current;
    if (currentElement && currentObserver) {
      currentObserver.observe(currentElement);
    }
    return () => {
      if (currentElement && currentObserver) {
        currentObserver.unobserve(currentElement);
      }
    };
  }, [state.content]);

  const generatePlaceholder = () => (
    <div className="flex flex-col w-full items-center justify-center h-full min-h-[200px] bg-gray-200 animate-pulse rounded-lg">
      <div className="h-3/4 w-2/3 bg-gray-300 rounded-md" />
      <div className="h-6 w-2/3 mt-2 bg-gray-300 rounded" />
    </div>
  );

  const getItemsPerRow = () => {
    if (window.innerWidth >= 1280) return 6; // xl
    if (window.innerWidth >= 1024) return 5; // lg
    if (window.innerWidth >= 768) return 4;  // md
    return 3;                                
  };

  const renderContent = () => {
    const items = state.content.map((item, index) => {
      const isLastElement = index === state.content.length - 1;
      const posterPath = item.poster_path
        ? `${POSTER_BASE_URL}${item.poster_path}`
        : '/assets/placeholder.jpg';

      return (
        <div
          key={item.id}
          ref={isLastElement ? lastElementRef : null}
          className="aspect-[2/3] min-h-[200px] w-full mb-28 transform transition-transform duration-300 hover:scale-105"
        >
          <ContentCard
            title={item.title || item.name}
            poster={posterPath}
            rating={item.vote_average}
            onClick={() => onSelect(item)}
            releaseDate={item.release_date || item.first_air_date}
            aria-label={`Select ${item.title || item.name}`}
          />
        </div>
      );
    });

    const itemsPerRow = getItemsPerRow();
    const missingItems = itemsPerRow - (items.length % itemsPerRow);

    if (missingItems < itemsPerRow) {
      for (let i = 0; i < missingItems; i++) {
        items.push(
          <div key={`placeholder-${i}`} className="aspect-[2/3] min-h-[200px] w-full mb-4">
            {generatePlaceholder()}
          </div>
        );
      }
    }

    return items;
  };

  return (
    <div className=" px-2 sm:px-4 py-6">
      <div className="grid w-full grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {renderContent()}
      </div>
      {state.loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-500 border-t-transparent shadow-lg" />
        </div>
      )}
      {state.error && <ErrorWarning onRetry={loadContent} errorMessage={state.error} />}
    </div>
  );
};

ContentGrid.propTypes = {
  genreId: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['movie', 'tv']).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default ContentGrid;
