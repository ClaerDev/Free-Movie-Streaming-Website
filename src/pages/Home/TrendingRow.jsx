import { useState, useEffect, useRef } from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import ContentCard from './ContentCard';

const API_KEY  = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const POSTER   = 'https://image.tmdb.org/t/p/w500';

function useTrendingRow(type) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url = new URL(`${BASE_URL}/trending/${type}/week`);
        url.searchParams.append('api_key', API_KEY);
        url.searchParams.append('language', 'en-US');
        const res  = await fetch(url);
        const data = await res.json();
        if (!cancelled) setItems((data.results ?? []).filter(i => i.poster_path).slice(0, 20));
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [type]);

  return { items, loading };
}

export default function TrendingRow({ title, type, onSelect }) {
  const { items, loading } = useTrendingRow(type);
  const rowRef = useRef(null);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="mb-10 px-6">
        <h2 className="text-white font-bold text-xl mb-4">{title}</h2>
        <div className="flex gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[180px] h-[270px] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mb-10 group/row">
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-white font-bold text-xl tracking-tight">{title}</h2>
        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <BiChevronLeft className="text-xl" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <BiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      {/* Scroll row */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar px-6 pb-2"
      >
        {items.map((item) => {
          const releaseDate = item.release_date || item.first_air_date || '';
          return (
            <div key={item.id} className="shrink-0 w-[180px]">
              <ContentCard
                title={item.title || item.name}
                poster={item.poster_path ? `${POSTER}${item.poster_path}` : null}
                rating={item.vote_average}
                releaseDate={releaseDate.slice(0, 4)}
                onClick={() => onSelect(item, type)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
