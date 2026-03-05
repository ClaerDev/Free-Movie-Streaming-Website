import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import ContentCard from './ContentCard';
import { fetchContentByGenre, fetchTrending } from './Fetcher';
import { SPECIAL_PARAMS } from './tmdb';
import { BiWifi } from 'react-icons/bi';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const MAX_PAGES = 500;

const ErrorWarning = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <BiWifi className="text-red-400 w-10 h-10" />
    <p className="text-gray-400 text-sm font-medium">Connection error — check your network</p>
  </div>
);

const ContentGrid = ({ genreId, type, onSelect, sortBy = 'popularity.desc' }) => {
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

    // If no genreId, fetch trending instead
    if (genreId == null) {
      try {
        const newContent = await fetchTrending(type, state.page);
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
        setState((prev) => ({ ...prev, error: error.message, loading: false }));
      } finally {
        loadingRef.current = false;
      }
      return;
    }

    // Resolve special-category override params (negative genreId = special)
    const overrideParams = genreId < 0 ? (SPECIAL_PARAMS[`${genreId}_${type}`] ?? null) : null;

    try {
      const newContent = await fetchContentByGenre(type, genreId, state.page, overrideParams, sortBy);
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
  }, [genreId, type, state.page, state.uniqueIds, sortBy]);

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
  }, [genreId, type, sortBy]);

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
    <div className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
  );

  const renderContent = () => {
    return state.content.map((item, index) => {
      const isLastElement = index === state.content.length - 1;
      const posterPath = item.poster_path
        ? `${POSTER_BASE_URL}${item.poster_path}`
        : '/assets/placeholder.jpg';

      return (
        <div
          key={item.id}
          ref={isLastElement ? lastElementRef : null}
        >
          <ContentCard
            title={item.title || item.name}
            poster={posterPath}
            rating={item.vote_average}
            onClick={() => onSelect(item)}
            releaseDate={item.release_date || item.first_air_date}
          />
        </div>
      );
    });
  };

  return (
    <div className="px-2 sm:px-4 py-4">
      {/* Initial loading skeleton */}
      {state.content.length === 0 && state.loading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
        {renderContent()}
      </div>

      {/* Infinite-scroll spinner */}
      {state.content.length > 0 && state.loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-red-600 border-t-transparent" />
        </div>
      )}

      {state.error && <ErrorWarning />}
    </div>
  );
};

ContentGrid.propTypes = {
  genreId: PropTypes.number,
  type: PropTypes.oneOf(['movie', 'tv']).isRequired,
  onSelect: PropTypes.func.isRequired,
  sortBy: PropTypes.string,
};

export default ContentGrid;
