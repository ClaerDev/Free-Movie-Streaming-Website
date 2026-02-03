import React, {
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from "react";
import PropTypes from "prop-types";
import { fetchSeriesDetails, fetchAllEpisodes } from "../Fetcher";
import { FaRedo } from "react-icons/fa";
import Loadingspinner from "../resused/Loadingspinner";
import VideoPlayer from "./VideoPlayer";

const MemoizedVideoPlayer = memo(VideoPlayer);

const TvDetails = ({ tvId }) => {
  const [tv, setTv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [allSeasons, setAllSeasons] = useState([]);
  const [viewingSeason, setViewingSeason] = useState(null);
  const [playingSeason, setPlayingSeason] = useState(null);
  const [playingEpisode, setPlayingEpisode] = useState(null);

  const episodeListRef = useRef(null);
  const activeEpisodeRef = useRef(null);

  const loadTvData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryLoading(true);
    try {
      const [seriesData, seasonsData] = await Promise.all([
        fetchSeriesDetails(tvId),
        fetchAllEpisodes(tvId),
      ]);

      setTv(seriesData);

      // Filter out season 0 (specials) and sort remaining seasons
      const filteredSeasons = (seasonsData || [])
        .filter(season => season.season_number > 0)
        .sort((a, b) => a.season_number - b.season_number);
      
      setAllSeasons(filteredSeasons);

      if (filteredSeasons.length > 0) {
        const firstSeason = filteredSeasons[0];
        const firstSeasonNumber = firstSeason.season_number;
        const firstEpisode = firstSeason.episodes?.find(ep => ep.episode_number);
        const firstEpisodeNumber = firstEpisode?.episode_number ?? 1;

        setViewingSeason(firstSeasonNumber);
        setPlayingSeason(firstSeasonNumber);
        setPlayingEpisode(firstEpisodeNumber);
      } else {
        setViewingSeason(null);
        setPlayingSeason(null);
        setPlayingEpisode(null);
      }
    } catch (err) {
      console.error("Error fetching TV data:", err);
      setError(`Failed to load TV show details. Please try again.`);
    } finally {
      setLoading(false);
      setRetryLoading(false);
    }
  }, [tvId]);

  useEffect(() => {
    loadTvData();
    return () => {
      setTv(null);
      setAllSeasons([]);
      setViewingSeason(null);
      setPlayingSeason(null);
      setPlayingEpisode(null);
    }
  }, [loadTvData]);

  useEffect(() => {
    if (activeEpisodeRef.current && episodeListRef.current) {
      if (viewingSeason === playingSeason) {
        activeEpisodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [viewingSeason, playingSeason, playingEpisode]);

  const handleSeasonSelect = (seasonNumber) => {
    setViewingSeason(seasonNumber);
  };

  const handleEpisodeSelect = (seasonNumber, episodeNumber) => {
    setPlayingSeason(seasonNumber);
    setPlayingEpisode(episodeNumber);
  };

  const currentViewingSeasonData = allSeasons.find(
    (s) => s.season_number === viewingSeason
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loadingspinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 backdrop-blur-md border border-red-700 rounded-xl p-4 sm:p-8 max-w-md w-full text-center shadow-lg">
          <p className="text-red-300 mb-6 text-base sm:text-lg">{error}</p>
          <button
            onClick={loadTvData}
            className="w-full bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
            disabled={retryLoading}
          >
            <FaRedo className={`${retryLoading ? "animate-spin" : ""}`} />
            {retryLoading ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (!tv) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <p className="text-gray-400 text-lg sm:text-xl font-medium">TV Show data not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-200 pb-10 sm:pb-20">
      {/* Video Player Area */}
      <div className="w-full bg-black shadow-lg">
        <div className="w-full mx-auto max-w-screen-xl aspect-video">
          {playingSeason !== null && playingEpisode !== null ? (
            <MemoizedVideoPlayer
              tvId={tvId}
              season={playingSeason}
              episode={playingEpisode}
              title={tv.name}
              key={`${tvId}-${playingSeason}-${playingEpisode}`}
            />
          ) : (
            <div className="w-full aspect-video bg-black flex items-center justify-center text-gray-500 text-sm sm:text-base">
              Select an episode to begin watching.
            </div>
          )}
        </div>
      </div>

      {/* Episode Selector Section */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-screen-xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3 text-white">{tv.name || "TV Series"}</h2>
        <p className="text-gray-400 mb-4 sm:mb-6 line-clamp-3 text-sm sm:text-base">{tv.overview}</p>

        {allSeasons && allSeasons.length > 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-md border border-gray-700/50">
            {/* Season Selection */}
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-300">Seasons</h3>
              <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                {allSeasons.map((season) => (
                  <button
                    key={season.id || `season-${season.season_number}`}
                    onClick={() => handleSeasonSelect(season.season_number)}
                    className={`
                      px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex-shrink-0 transition-all duration-200 ease-in-out text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800
                      ${viewingSeason === season.season_number
                        ? 'bg-blue-600 text-white shadow-md focus:ring-blue-500'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white focus:ring-gray-500'
                      }
                      ${playingSeason === season.season_number ? 'ring-2 ring-inset ring-cyan-400' : ''}
                    `}
                  >
                    Season {season.season_number}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Selection */}
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-gray-300">
                Episodes
                {currentViewingSeasonData ? ` - Season ${viewingSeason}` : ''}
              </h3>
              {currentViewingSeasonData && currentViewingSeasonData.episodes?.length > 0 ? (
                <div ref={episodeListRef} className="grid grid-flow-col gap-2 overflow-x-auto pb-2 custom-scrollbar auto-cols-min">
                  {currentViewingSeasonData.episodes
                    .sort((a, b) => a.episode_number - b.episode_number)
                    .map((episode) => {
                      const isPlayingThis = playingSeason === viewingSeason && playingEpisode === episode.episode_number;
                      return (
                        <button
                          ref={isPlayingThis ? activeEpisodeRef : null}
                          key={episode.id || `ep-${episode.episode_number}`}
                          onClick={() => handleEpisodeSelect(currentViewingSeasonData.season_number, episode.episode_number)}
                          className={`
                            w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-md flex-shrink-0 flex flex-col items-center justify-center 
                            transition-all duration-200 ease-in-out text-xs md:text-sm font-medium focus:outline-none focus:ring-2 
                            focus:ring-offset-1 focus:ring-offset-gray-800 leading-tight p-1 relative
                            ${isPlayingThis
                              ? 'bg-blue-600 text-white shadow-lg scale-105 focus:ring-blue-500'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white focus:ring-gray-500'
                            }
                          `}
                          title={episode.name || `Episode ${episode.episode_number}`}
                        >
                          <span className="text-base sm:text-lg md:text-xl font-bold">{episode.episode_number}</span>
                          {isPlayingThis && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm sm:text-base">No episodes found for this season.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
            <p className="text-gray-400 italic text-center text-sm sm:text-base">No season or episode data available for this series.</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

TvDetails.propTypes = {
  tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default memo(TvDetails);