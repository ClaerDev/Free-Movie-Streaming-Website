import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// AdBanner — PropellerAds display unit
//
// HOW TO SET UP (takes ~5 minutes):
//   1. Sign up at https://publishers.propellerads.com
//   2. Add your site (weflix.app) — approval is usually instant/same day
//   3. Go to "Ad Units" → Create a new zone
//   4. Choose "Banner" format → pick a size
//   5. Copy the Zone ID (a number like 1234567)
//   6. Add to your .env:
//        VITE_PA_ZONE_HOMEPAGE=1234567
//        VITE_PA_ZONE_DETAILS=1234568
//        VITE_PA_ZONE_SEARCH=1234569
//   7. Also enable "Push Notifications" zone for extra passive income
//
// PropellerAds also has a "Smart Tag" that auto-picks the best ad format.
// Zones are injected as script tags — no iframe needed.
// ─────────────────────────────────────────────────────────────────────────────

const PROPELLER_CDN = 'https://vaugroar.com/act/files/tag.min.js';

/**
 * @param {string}  zoneId   - Your PropellerAds zone ID (from .env)
 * @param {string}  className - Extra Tailwind classes for the wrapper
 * @param {string}  label    - Small label text above the ad
 * @param {boolean} showLabel - Whether to show the "Advertisement" label
 * @param {'banner'|'native'} format - Visual hint for layout
 */
export default function AdBanner({
  zoneId,
  className = '',
  label = 'Advertisement',
  showLabel = true,
  format = 'banner',
}) {
  const containerRef = useRef(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    // Only inject once per mount, and only if we have a real zone ID
    if (!zoneId || zoneId === 'YOUR_ZONE_ID' || injectedRef.current) return;
    if (!containerRef.current) return;

    injectedRef.current = true;

    const script = document.createElement('script');
    script.src = `${PROPELLER_CDN}?z=${zoneId}`;
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script);
      }
      injectedRef.current = false;
    };
  }, [zoneId]);

  // Don't render anything if no zone ID is configured yet
  if (!zoneId || zoneId === 'YOUR_ZONE_ID') {
    return (
      <div className={`flex flex-col items-center gap-1.5 ${className}`}>
        {showLabel && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-700 select-none">
            {label}
          </span>
        )}
        {/* Placeholder slot — visible only in dev until zone ID is set */}
        <div
          className={`w-full flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-gray-700 text-xs font-mono select-none ${
            format === 'banner' ? 'h-[90px]' : 'h-[250px]'
          }`}
        >
          [ Ad Slot — set VITE_PA_ZONE_* in .env ]
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 select-none">
          {label}
        </span>
      )}

      {/* Outer frame that matches the dark aesthetic */}
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-[#0d0f16]/50 border border-white/[0.04] flex justify-center ${
          format === 'banner' ? 'min-h-[90px]' : 'min-h-[120px]'
        }`}
      >
        {/* Subtle shimmer behind the ad while it loads */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.015] to-transparent animate-pulse pointer-events-none" />

        {/* PropellerAds injects the actual creative here */}
        <div ref={containerRef} className="relative z-10 w-full flex justify-center" />
      </div>
    </div>
  );
}
