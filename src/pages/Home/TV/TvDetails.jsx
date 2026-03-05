import React, {
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchSeriesDetails, fetchAllEpisodes } from "../Fetcher";
import { FaRedo, FaStar, FaArrowLeft } from "react-icons/fa";
import { BiCalendar, BiGlobe, BiTv } from "react-icons/bi";
import Loadingspinner from "../resused/Loadingspinner";
import VideoPlayer from "./VideoPlayer";

const MemoizedVideoPlayer = memo(VideoPlayer);

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER   = "https://image.tmdb.org/t/p/w342";
const STILL    = "https://image.tmdb.org/t/p/w300";

const Badge = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 bg-white/[0.07] border border-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-lg">
    {Icon && <Icon className="text-gray-400 shrink-0" />}
    {children}
  </span>
);

const TvDetails = ({ tvId: tvIdProp }) => {
  const { slug } = useParams();
  const tvId = tvIdProp ?? parseInt(slug);
  const navigate = useNavigate();
  const [tv,             setTv]             = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [retrying,       setRetrying]       = useState(false);
  const [allSeasons,     setAllSeasons]     = useState([]);
  const [viewingSeason,  setViewingSeason]  = useState(null);
  const [playingSeason,  setPlayingSeason]  = useState(null);
  const [playingEpisode, setPlayingEpisode] = useState(null);
  const [showOverview,   setShowOverview]   = useState(false);

  const activeEpisodeRef = useRef(null);
  const episodeListRef   = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetrying(true);
    try {
      const [seriesData, seasonsData] = await Promise.all([
        fetchSeriesDetails(tvId),
        fetchAllEpisodes(tvId),
      ]);
      setTv(seriesData);
      const filtered = (seasonsData ?? [])
        .filter(s => s.season_number > 0)
        .sort((a, b) => a.season_number - b.season_number);
      setAllSeasons(filtered);
      if (filtered.length > 0) {
        const first = filtered[0];
        const firstEp = first.episodes?.find(e => e.episode_number)?.episode_number ?? 1;
        setViewingSeason(first.season_number);
        setPlayingSeason(first.season_number);
        setPlayingEpisode(firstEp);
      }
    } catch {
      setError("Failed to load TV show details. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [tvId]);

  useEffect(() => {
    load();
    return () => {
      setTv(null); setAllSeasons([]);
      setViewingSeason(null); setPlayingSeason(null); setPlayingEpisode(null);
    };
  }, [load]);

  useEffect(() => {
    if (activeEpisodeRef.current && episodeListRef.current && viewingSeason === playingSeason) {
      activeEpisodeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [viewingSeason, playingSeason, playingEpisode]);

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

  if (!tv) return null;

  const rating   = tv.vote_average > 0 ? tv.vote_average.toFixed(1) : null;
  const year     = (tv.first_air_date ?? "").slice(0, 4);
  const genres   = (tv.genres ?? []).slice(0, 3).map(g => g.name).join(" · ");
  const overview = tv.overview ?? "";
  const truncated = overview.length > 240 && !showOverview
    ? overview.slice(0, 240) + "…"
    : overview;

  const currentSeasonData = allSeasons.find(s => s.season_number === viewingSeason);

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
      <div className="px-4 md:px-8 pt-6 mb-8">
        <div className="w-full rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60">
          <div className="w-full aspect-video bg-black">
            {playingSeason !== null && playingEpisode !== null ? (
              <MemoizedVideoPlayer
                tvId={tvId}
                season={playingSeason}
                episode={playingEpisode}
                title={tv.name}
                key={`${tvId}-${playingSeason}-${playingEpisode}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                Select an episode to start watching
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Episode Selector ─────────────────────── */}
      {allSeasons.length > 0 && (
        <div className="px-4 md:px-10 pb-12 max-w-5xl">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-red-500" />
            <h2 className="text-lg font-bold">Episodes</h2>
          </div>

          {/* Season tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">
            {allSeasons.map(season => (
              <button
                key={season.id ?? season.season_number}
                onClick={() => setViewingSeason(season.season_number)}
                className={`
                  relative shrink-0 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap
                  transition-all duration-150 focus:outline-none
                  ${viewingSeason === season.season_number
                    ? "bg-red-600/20 text-white ring-1 ring-red-500/50"
                    : "bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.09]"
                  }
                `}
              >
                {playingSeason === season.season_number && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
                Season {season.season_number}
              </button>
            ))}
          </div>

          {/* Episode cards */}
          {currentSeasonData?.episodes?.length > 0 ? (
            <div
              ref={episodeListRef}
              className="grid grid-flow-col auto-cols-[160px] gap-3 overflow-x-auto hide-scrollbar pb-2"
            >
              {[...currentSeasonData.episodes]
                .sort((a, b) => a.episode_number - b.episode_number)
                .map(ep => {
                  const isPlaying = playingSeason === viewingSeason && playingEpisode === ep.episode_number;
                  return (
                    <button
                      ref={isPlaying ? activeEpisodeRef : null}
                      key={ep.id ?? ep.episode_number}
                      onClick={() => {
                        setPlayingSeason(currentSeasonData.season_number);
                        setPlayingEpisode(ep.episode_number);
                      }}
                      className={`
                        group relative flex flex-col rounded-xl overflow-hidden text-left
                        ring-1 transition-all duration-150 focus:outline-none shrink-0
                        ${isPlaying
                          ? "ring-red-500 bg-red-600/10"
                          : "ring-white/[0.07] bg-white/[0.03] hover:ring-white/20 hover:bg-white/[0.06]"
                        }
                      `}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-video bg-[#111827]">
                        {ep.still_path ? (
                          <img
                            src={`${STILL}${ep.still_path}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BiTv className="text-gray-700 text-2xl" />
                          </div>
                        )}
                        {/* Episode number badge */}
                        <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          E{ep.episode_number}
                        </span>
                        {/* Playing indicator */}
                        {isPlaying && (
                          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-red-600/80 flex items-center justify-center">
                              <span className="text-white text-[10px] ml-0.5">▶</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Episode info */}
                      <div className="px-2.5 py-2">
                        <p className={`text-xs font-semibold line-clamp-1 ${isPlaying ? "text-red-400" : "text-gray-200"}`}>
                          {ep.name || `Episode ${ep.episode_number}`}
                        </p>
                        {ep.runtime && (
                          <p className="text-gray-600 text-[10px] mt-0.5">{ep.runtime}m</p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-600 text-sm italic">No episodes available for this season.</p>
          )}
        </div>
      )}

      {/* ── Show details ─────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 420 }}>
        {tv.backdrop_path && (
          <>
            <img
              src={`${BACKDROP}${tv.backdrop_path}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-[#0a0c12]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-transparent to-[#0a0c12]/50" />
          </>
        )}

        <div className="relative z-10 flex flex-col md:flex-row gap-8 px-6 md:px-10 pt-10 pb-12 items-start max-w-5xl">
          {tv.poster_path && (
            <img
              src={`${POSTER}${tv.poster_path}`}
              alt={tv.name}
              className="w-36 md:w-44 rounded-2xl shadow-2xl ring-1 ring-white/10 shrink-0 hidden md:block"
            />
          )}

          <div className="flex flex-col gap-4 max-w-2xl">
            {tv.tagline && (
              <p className="text-red-400 text-sm font-medium tracking-wide italic">"{tv.tagline}"</p>
            )}
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{tv.name}</h1>

            <div className="flex flex-wrap gap-2">
              {rating && (
                <span className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <FaStar className="text-[10px]" />{rating}
                </span>
              )}
              {year  && <Badge icon={BiCalendar}>{year}</Badge>}
              {allSeasons.length > 0 && (
                <Badge icon={BiTv}>{allSeasons.length} Season{allSeasons.length !== 1 ? "s" : ""}</Badge>
              )}
              {genres && <Badge>{genres}</Badge>}
              {tv.original_language && (
                <Badge icon={BiGlobe}>{tv.original_language.toUpperCase()}</Badge>
              )}
            </div>

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

            <div className="flex flex-wrap gap-8 pt-1">
              {tv.networks?.length > 0 && (
                <div>
                  <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mb-1">Network</p>
                  <p className="text-gray-300 text-sm">{tv.networks.slice(0, 2).map(n => n.name).join(", ")}</p>
                </div>
              )}
              {tv.status && (
                <div>
                  <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mb-1">Status</p>
                  <p className="text-gray-300 text-sm">{tv.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

TvDetails.propTypes = {
  tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(TvDetails);
