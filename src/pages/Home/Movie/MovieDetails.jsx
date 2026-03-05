import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchMovieDetails } from "../Fetcher";
import { FaRedo, FaStar, FaArrowLeft } from "react-icons/fa";
import { BiCalendar, BiTime, BiMovie, BiGlobe } from "react-icons/bi";
import Loadingspinner from "../resused/Loadingspinner";
import VideoPlayer from "./VideoPlayer";

const MemoizedVideoPlayer = memo(VideoPlayer);

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER   = "https://image.tmdb.org/t/p/w500";

const Badge = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-lg">
    {Icon && <Icon className="text-gray-400 shrink-0" />}
    {children}
  </span>
);

const MovieDetails = ({ movieId: movieIdProp }) => {
  const { slug } = useParams();
  const movieId = movieIdProp ?? parseInt(slug);
  const navigate = useNavigate();
  const [movie,        setMovie]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [retrying,     setRetrying]     = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetrying(true);
    try {
      const data = await fetchMovieDetails(movieId);
      setMovie(data);
    } catch {
      setError("Failed to load movie. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [movieId]);

  useEffect(() => { load(); }, [load]);

  const formatRuntime = (m) => {
    if (!m) return null;
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loadingspinner size="large" />
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-red-300 mb-6">{error}</p>
        <button
          onClick={load}
          disabled={retrying}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <FaRedo className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );

  if (!movie) return null;

  const year     = movie.release_date?.slice(0, 4);
  const runtime  = formatRuntime(movie.runtime);
  const rating   = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  const genres   = (movie.genres ?? []).slice(0, 3).map(g => g.name).join(" · ");
  const overview = movie.overview ?? "";
  const truncated = overview.length > 240 && !showOverview
    ? overview.slice(0, 240) + "…"
    : overview;

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white">

      {/* ── Back button ───────────────────────────── */}
      <div className="px-4 md:px-8 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm group transition-colors"
        >
          <FaArrowLeft className="group-hover:-translate-x-0.5 transition-transform text-xs" />
          Back
        </button>
      </div>

      {/* ── Video Player ──────────────────────────── */}
      <div className="px-4 md:px-8 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 rounded-full bg-red-500" />
          <h2 className="text-lg font-bold">Watch Now</h2>
        </div>
        <div className="w-full rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60">
          <div className="w-full aspect-video bg-black">
            <MemoizedVideoPlayer movieId={movieId} title={movie.title} />
          </div>
        </div>
      </div>

      {/* ── Hero backdrop ─────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 440 }}>
        {movie.backdrop_path && (
          <>
            <img
              src={`${BACKDROP}${movie.backdrop_path}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-[#0a0c12]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-transparent to-[#0a0c12]/50" />
          </>
        )}

        <div className="relative z-10 flex flex-col md:flex-row gap-8 px-6 md:px-10 pt-10 pb-12 items-start max-w-5xl">
          {/* Poster */}
          {movie.poster_path && (
            <img
              src={`${POSTER}${movie.poster_path}`}
              alt={movie.title}
              className="w-36 md:w-44 rounded-2xl shadow-2xl ring-1 ring-white/10 shrink-0 hidden md:block"
            />
          )}

          <div className="flex flex-col gap-4 max-w-2xl">
            {/* Title */}
            <div>
              {movie.tagline && (
                <p className="text-red-400 text-sm font-medium tracking-wide mb-2 italic">
                  "{movie.tagline}"
                </p>
              )}
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {movie.title}
              </h1>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {rating && (
                <span className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <FaStar className="text-yellow-400 text-[10px]" />
                  {rating}
                </span>
              )}
              {year     && <Badge icon={BiCalendar}>{year}</Badge>}
              {runtime  && <Badge icon={BiTime}>{runtime}</Badge>}
              {genres   && <Badge icon={BiMovie}>{genres}</Badge>}
              {movie.original_language && (
                <Badge icon={BiGlobe}>{movie.original_language.toUpperCase()}</Badge>
              )}
            </div>

            {/* Overview */}
            {overview && (
              <div>
                <p className="text-gray-300 text-sm leading-relaxed">{truncated}</p>
                {overview.length > 240 && (
                  <button
                    onClick={() => setShowOverview(p => !p)}
                    className="mt-2 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors"
                  >
                    {showOverview ? "Show less ↑" : "Show more ↓"}
                  </button>
                )}
              </div>
            )}

            {/* Production details */}
            <div className="flex flex-wrap gap-8 pt-1">
              {movie.production_companies?.length > 0 && (
                <div>
                  <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mb-1">Studio</p>
                  <p className="text-gray-300 text-sm">
                    {movie.production_companies.slice(0, 2).map(c => c.name).join(", ")}
                  </p>
                </div>
              )}
              {movie.production_countries?.length > 0 && (
                <div>
                  <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mb-1">Country</p>
                  <p className="text-gray-300 text-sm">
                    {movie.production_countries.map(c => c.name).join(", ")}
                  </p>
                </div>
              )}
              {movie.status && (
                <div>
                  <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mb-1">Status</p>
                  <p className="text-gray-300 text-sm">{movie.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

MovieDetails.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(MovieDetails);

