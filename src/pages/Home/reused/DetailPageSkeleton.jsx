import React from "react";
import PropTypes from "prop-types";

const pulse = "animate-pulse bg-white/[0.06]";

const DetailPageSkeleton = ({ type = "movie" }) => {
  const isTv = type === "tv";

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,0.14),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.08),transparent_40%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-12 pt-5">
        <div className={`h-10 w-24 rounded-full ${pulse}`} />
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-5 md:px-10 lg:px-16 pt-5">
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-9 w-9 rounded-xl ${pulse}`} />
            <div className="flex-1 min-w-0">
              <div className={`h-2.5 w-24 rounded ${pulse} mb-2`} />
              <div className={`h-4 w-56 max-w-full rounded ${pulse}`} />
            </div>
            <div className={`h-8 w-20 rounded-xl ${pulse}`} />
          </div>
          <div className={`w-full aspect-video rounded-xl ${pulse}`} />
        </div>

        {isTv && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 mb-8">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={`h-9 w-20 rounded-full ${pulse}`} />
              ))}
            </div>
            <div className="grid grid-flow-col auto-cols-[190px] gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={`h-44 rounded-xl ${pulse}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative h-[420px] mt-2">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-14">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className={`hidden md:block h-72 w-48 rounded-2xl ${pulse}`} />
            <div className="flex-1 max-w-2xl">
              <div className={`h-11 w-[70%] rounded ${pulse} mb-3`} />
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className={`h-7 w-20 rounded-full ${pulse}`} />
                ))}
              </div>
              <div className="space-y-2">
                <div className={`h-3 w-full rounded ${pulse}`} />
                <div className={`h-3 w-[92%] rounded ${pulse}`} />
                <div className={`h-3 w-[78%] rounded ${pulse}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DetailPageSkeleton.propTypes = {
  type: PropTypes.oneOf(["movie", "tv"]),
};

export default DetailPageSkeleton;
