import { useState, useEffect, useRef, useCallback } from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { FiArrowRight } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import ContentCard from './ContentCard';
import { useWatchlist } from '../../context/WatchlistContext';

const API_KEY = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const POSTER = 'https://image.tmdb.org/t/p/w500';

/**
 * Fetches TMDB recommendations for a given seed item.
 * Returns up to `count` results with poster images.
 */
async function fetchRecsForItem(mediaType, mediaId, count = 8) {
  try {
    const url = new URL(`${BASE_URL}/${mediaType}/${mediaId}/recommendations`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? [])
      .filter(i => i.poster_path)
      .slice(0, count)
      .map(i => ({ ...i, media_type: mediaType }));
  } catch {
    return [];
  }
}

/**
 * Picks up to `seedCount` seed items from CW + Watchlist, merges,
 * fetches recommendations, deduplicates.
 */
async function buildPersonalisedFeed(userId, watchlistItems, seedCount = 4) {
  // 1. Get the most recently watched items
  let cwItems = [];
  try {
    const q = query(
      collection(db, 'users', userId, 'continue_watching'),
      orderBy('updatedAt', 'desc'),
      limit(seedCount)
    );
    const snap = await getDocs(q);
    snap.forEach(d => cwItems.push(d.data()));
  } catch { /* ignore */ }

  // 2. Pad with watchlist items if we don't have enough CW seeds
  const seeds = [...cwItems];
  for (const wl of (watchlistItems ?? [])) {
    if (seeds.length >= seedCount) break;
    if (!seeds.find(s => s.id === wl.mediaId)) {
      seeds.push({ id: wl.mediaId, mediaType: wl.type ?? 'movie', title: wl.title });
    }
  }

  if (seeds.length === 0) return { items: [], seedTitles: [] };

  const rawTitles = seeds
    .map(s => s.title || s.name || '')
    .filter(Boolean)
    .map(t => t.replace(/\s*-\s*S\d+E\d+.*$/, '')); // Strip " - S1E1"
  const seedTitles = [...new Set(rawTitles)];

  // 3. Fetch recs in parallel
  const recArrays = await Promise.all(
    seeds.map(s => fetchRecsForItem(s.mediaType ?? 'movie', s.id, 8))
  );

  // 4. Deduplicate by id
  const seen = new Set();
  const merged = [];
  for (const arr of recArrays) {
    for (const item of arr) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }

  // 5. Shuffle slightly for variety (interleave)
  return { items: merged.slice(0, 40), seedTitles };
}

export default function PersonalizedRow({ onSelect }) {
  const [items, setItems] = useState([]);
  const [seedTitles, setSeedTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { watchlistItems } = useWatchlist();

  const rowRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track auth
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Fetch personalised feed when user / watchlist changes
  useEffect(() => {
    if (!user) { setItems([]); return; }

    let cancelled = false;
    setLoading(true);

    buildPersonalisedFeed(user.uid, watchlistItems).then(({ items: feed, seedTitles: titles }) => {
      if (cancelled) return;
      setItems(feed);
      setSeedTitles(titles);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user, watchlistItems]);

  // ── Drag-to-scroll ────────────────────────────────────────────────────────
  const scroll = dir => {
    rowRef.current?.scrollBy({ left: dir * 580, behavior: 'smooth' });
  };

  const onRowMouseDown = useCallback(e => {
    if (e.button !== 0) return;
    const el = rowRef.current;
    if (!el) return;
    dragStateRef.current = { active: true, startX: e.pageX, startScrollLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
  }, []);

  const onRowMouseMove = useCallback(e => {
    const el = rowRef.current;
    const drag = dragStateRef.current;
    if (!el || !drag.active) return;
    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endRowDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    suppressClickRef.current = drag.moved;
    setIsDragging(false);
    setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endRowDrag);
    return () => window.removeEventListener('mouseup', endRowDrag);
  }, [endRowDrag]);

  // Loading skeleton
  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-3 px-4 sm:px-6 mb-5">
          <div className="w-40 h-5 rounded-md bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 sm:px-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[155px] h-[235px] rounded-xl bg-white/[0.05] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Don't render if not logged in or no recommendations
  if (!user || items.length === 0) return null;

  // Pick one seed title for the subtitle
  // Pick up to two seed titles for the subtitle and format them
  const subtitleNodes = seedTitles.length > 0 ? (
    <>
      Based on{' '}
      {seedTitles.slice(0, 2).map((t, i) => (
        <span key={i}>
          {i > 0 ? ', ' : ''}
          <span className="text-gray-300 font-medium">{t}</span>
        </span>
      ))}
      {seedTitles.length > 2 && <span className="text-gray-500"> & more</span>}
    </>
  ) : (
    'Based on your watch history'
  );

  return (
    <section className="mb-12 group/row" style={{ overflow: 'visible' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 mt-0.5 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
            <HiSparkles className="text-lg" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg md:text-xl tracking-tight leading-tight">
              Because you watched
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">{subtitleNodes}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-40 group-hover/row:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <BiChevronLeft className="text-xl" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <BiChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      {/* ── Card row ── */}
      <div
        ref={rowRef}
        onMouseDown={onRowMouseDown}
        onMouseMove={onRowMouseMove}
        onMouseLeave={endRowDrag}
        className={`flex gap-3 overflow-x-auto hide-scrollbar px-4 sm:px-6 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ paddingTop: 24, paddingBottom: 24, marginTop: -16, marginBottom: -16 }}
      >
        {items.map(item => (
          <div key={`${item.media_type}-${item.id}`} className="shrink-0" style={{ width: 160 }}>
            <ContentCard
              title={item.title || item.name}
              poster={item.poster_path ? `${POSTER}${item.poster_path}` : null}
              rating={item.vote_average}
              releaseDate={(item.release_date || item.first_air_date || '').slice(0, 4)}
              onClick={() => {
                if (suppressClickRef.current) return;
                onSelect(item, item.media_type ?? 'movie');
              }}
              mediaId={item.id}
              mediaType={item.media_type ?? 'movie'}
              posterPath={item.poster_path}
              voteAverage={item.vote_average}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
