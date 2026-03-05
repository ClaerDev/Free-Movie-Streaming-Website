import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toDetailPath } from './urlUtils';
import { FaPlay } from 'react-icons/fa';

const API_KEY  = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const BACKDROP = 'https://image.tmdb.org/t/p/original';

const useTrending = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url = new URL(`${BASE_URL}/trending/all/week`);
        url.searchParams.append('api_key', API_KEY);
        url.searchParams.append('language', 'en-US');
        const res  = await fetch(url);
        const data = await res.json();
        if (!cancelled) {
          setItems(
            (data.results ?? [])
              .filter(i => i.backdrop_path && (i.title || i.name) && i.overview)
              .slice(0, 5)
          );
        }
      } catch { /* silently ignore */ }
      finally  { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
};

export default function HeroBanner() {
  const { items, loading } = useTrending();
  const [active, setActive]   = useState(0);
  const [fade,   setFade]     = useState(true);
  const navigate = useNavigate();

  // Auto-advance every 7 s
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => goTo((prev) => (prev + 1) % items.length), 7000);
    return () => clearInterval(id);
  }, [items.length]);

  const goTo = useCallback((indexOrUpdater) => {
    setFade(false);
    setTimeout(() => {
      setActive(typeof indexOrUpdater === 'function'
        ? indexOrUpdater
        : indexOrUpdater);
      setFade(true);
    }, 250);
  }, []);

  const handleDot = (i) => {
    if (i === active) return;
    goTo(i);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!items.length) return null;

  const item   = items[active];
  const isTV   = item.media_type === 'tv';
  const title  = item.title  || item.name;
  const year   = (item.release_date || item.first_air_date || '').slice(0, 4);
  const type   = isTV ? 'TV Series' : 'Movie';
  const rating = item.vote_average?.toFixed(1);

  const handlePlay = () => {
    navigate(toDetailPath(isTV ? 'tv' : 'movie', item.id, title));
  };


  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
      >
        <img
          src={`${BACKDROP}${item.backdrop_path}`}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col justify-center h-full px-12 pb-16 max-w-2xl transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-3 drop-shadow-lg">
          {title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-2 text-gray-300 text-sm mb-4">
          {year && <span className="font-medium">{year}</span>}
          {year && <span className="text-gray-500">•</span>}
          <span>{type}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-6">
          {rating && (
            <span className="flex items-center gap-1 bg-yellow-500 text-black text-xs font-bold px-2.5 py-1 rounded-md">
              ★ {rating}
            </span>
          )}
          <span className="border border-red-500 text-red-400 text-xs font-bold px-2.5 py-1 rounded-md tracking-wide uppercase">
            Trending
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-red-600/30"
          >
            <FaPlay className="text-sm" />
            Play
          </button>

        </div>

        {/* Overview */}
        {item.overview && (
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 max-w-lg">
            {item.overview}
          </p>
        )}
      </div>

      {/* Dot pagination */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'bg-red-500 w-4 h-3'
                  : 'bg-gray-500/70 hover:bg-gray-400 w-3 h-3'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
