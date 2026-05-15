import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// AdBanner — Monetag In-Page Push banner (zone 11008150 / Amazing tag)
//
// Placed in specific locations:
//   - MovieDetails: between video player and info banner
//   - TvDetails:    between video player and info banner
//   - SearchPage:   between filters and results
//   - HomePage:     between Movies and TV sections
//
// Uses zone 11008150 (Amazing tag) which is a standalone Monetag zone
// separate from the global Wise Tag — so it won't double-fire.
// ─────────────────────────────────────────────────────────────────────────────

const MONETAG_ZONE = import.meta.env.VITE_MONETAG_ZONE_BANNER || '11008150';
const MONETAG_SRC  = 'https://nap5k.com/tag.min.js';

export default function AdBanner({ className = '' }) {
  const containerRef = useRef(null);
  const injectedRef  = useRef(false);

  useEffect(() => {
    if (injectedRef.current || !containerRef.current) return;
    injectedRef.current = true;

    // Monetag Amazing tag injection pattern
    const el = containerRef.current;
    const script = document.createElement('script');
    script.dataset.zone = MONETAG_ZONE;
    script.src = MONETAG_SRC;
    script.async = true;
    el.appendChild(script);

    return () => {
      injectedRef.current = false;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full flex justify-center items-center min-h-[10px] overflow-hidden ${className}`}
      aria-label="Advertisement"
    />
  );
}
