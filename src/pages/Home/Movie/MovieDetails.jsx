import React, {
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from "react";
import PropTypes from "prop-types";
import { fetchMovieDetails } from "../Fetcher";
import {
  FaRedo,
  FaChevronDown,
  FaChevronUp,
  FaStar,
  FaCalendar,
  FaClock,
  FaFilm,
  FaGlobe,
  FaPlay,
  FaInfoCircle,
  FaArrowLeft,
  FaTimes,
} from "react-icons/fa";
import Loadingspinner from "../resused/Loadingspinner";
import VideoPlayer from "./VideoPlayer";

const MemoizedVideoPlayer = memo(VideoPlayer);

const MovieDetails = ({ movieId, onBack }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("about"); // 'about' or 'watch'
  const descriptionRef = useRef(null);
  const videoContainerRef = useRef(null);
  const headerRef = useRef(null);

  // Track scroll for header transparency
  const [scrolled, setScrolled] = useState(false);

  const loadMovieData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryLoading(true);
    try {
      const data = await fetchMovieDetails(movieId);
      setMovie(data);
    } catch (err) {
      setError(`Failed to load movie. Please try again.`);
      console.error("Error fetching movie data:", err);
    } finally {
      setLoading(false);
      setRetryLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    loadMovieData();
  }, [loadMovieData]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleDescription = () => {
    setShowDescription((prev) => !prev);
    
    // Scroll to expanded content when showing more
    if (!showDescription && descriptionRef.current) {
      setTimeout(() => {
        descriptionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const truncateDescription = (description, maxLength) => {
    if (!description || description.length <= maxLength) {
      return description;
    }
    return showDescription ? description : `${description.slice(0, maxLength)}...`;
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handlePlayClick = () => {
    setActiveTab("watch");
    setIsPlaying(true);
    window.scrollTo(0, 0); // Scroll to top to see the video player
  };

  const handleInfoClick = () => {
    setActiveTab("about");
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const descriptionText = truncateDescription(movie?.overview, 150);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="pulse-animation">
          <Loadingspinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-900/30 backdrop-blur-md border border-red-700 rounded-xl p-6 max-w-md w-full text-center shadow-lg">
          <p className="text-red-300 mb-6 text-lg">{error}</p>
          <button
            onClick={loadMovieData}
            className="w-full bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-base"
            disabled={retryLoading}
          >
            <FaRedo className={`${retryLoading ? "animate-spin" : ""}`} />
            {retryLoading ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-300 text-lg font-medium">No movie data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-black overflow-x-hidden">
      {/* Fixed header - shows on scroll or always when video is playing */}
      <header 
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isPlaying
            ? "bg-black shadow-lg py-2" 
            : "bg-gradient-to-b from-black/80 to-transparent py-4"
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between">
         
          
          {/* Tab buttons for mobile */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePlayClick}
              className={`px-3 py-1 rounded ${
                activeTab === "watch" 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              <FaPlay size={12} className="inline mr-1" />
              <span className="text-xs font-medium">Watch</span>
            </button>
            <button 
              onClick={handleInfoClick}
              className={`px-3 py-1 rounded ${
                activeTab === "about" 
                  ? "bg-gray-700 text-white" 
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              <FaInfoCircle size={12} className="inline mr-1" />
              <span className="text-xs font-medium">Info</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Use tabs for Watch vs Info on mobile */}
      <div className="pt-16">
        {/* Video Player Tab */}
        {activeTab === "watch" && (
          <section className="w-full">
            <div 
              ref={videoContainerRef}
              className="w-full bg-black"
            >
              <div className="w-full mx-auto aspect-video">
                <MemoizedVideoPlayer 
                  movieId={movieId} 
                  title={movie.title}
                />
              </div>
            </div>
            
            {/* Small info display below video */}
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="text-lg font-bold mb-1">{movie.title}</h2>
              <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                {movie.release_date && (
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                )}
                {movie.runtime && (
                  <span>• {formatRuntime(movie.runtime)}</span>
                )}
                {movie.vote_average > 0 && (
                  <span>• <FaStar className="inline text-yellow-400" /> {movie.vote_average?.toFixed(1)}</span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <section className="w-full">
            {/* Backdrop image */}
            <div className="relative w-full aspect-video sm:aspect-[16/9] overflow-hidden">
              {movie.backdrop_path ? (
                <div className="absolute inset-0 bg-center bg-cover" 
                  style={{ 
                    backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
                  }}>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handlePlayClick}
                      className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                    >
                      <FaPlay className="text-white ml-1" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black">
                  {/* Fallback play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handlePlayClick}
                      className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                    >
                      <FaPlay className="text-white ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Title and info */}
            <div className="px-4 py-4">
              <h1 className="text-xl font-bold mb-2">{movie.title}</h1>
              
              {/* Movie Metadata Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.vote_average > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-md text-xs">
                    <FaStar className="text-yellow-400" />
                    <span>{movie.vote_average?.toFixed(1)}</span>
                  </span>
                )}
                
                {movie.release_date && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-md text-xs">
                    <FaCalendar className="text-gray-400" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </span>
                )}
                
                {movie.runtime && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-md text-xs">
                    <FaClock className="text-gray-400" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </span>
                )}
                
                {movie.genres && movie.genres.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-md text-xs">
                    <FaFilm className="text-gray-400" />
                    <span>{movie.genres.map(g => g.name).slice(0, 2).join(', ')}</span>
                  </span>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">About this movie</h2>
                <div className="prose prose-invert max-w-none" ref={descriptionRef}>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {descriptionText}
                  </p>
                </div>
                
                {movie.overview?.length > 150 && (
                  <button
                    onClick={handleToggleDescription}
                    className="mt-3 text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800 rounded-lg 
                    px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors 
                    bg-gray-800 hover:bg-gray-700"
                  >
                    {showDescription ? "Show less" : "Show more"}
                    {showDescription ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                )}
              </div>
              
              {/* Production Information */}
              {(movie.production_companies?.length > 0 || movie.production_countries?.length > 0) && (
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex flex-col gap-4 text-sm">
                    {movie.production_companies?.length > 0 && (
                      <div>
                        <h3 className="text-gray-400 mb-1 text-xs">Production</h3>
                        <p className="text-gray-300">
                          {movie.production_companies.slice(0, 2).map(c => c.name).join(', ')}
                          {movie.production_companies.length > 2 ? ' & others' : ''}
                        </p>
                      </div>
                    )}
                    
                    {movie.production_countries?.length > 0 && (
                      <div>
                        <h3 className="text-gray-400 mb-1 text-xs">Country</h3>
                        <p className="text-gray-300">
                          {movie.production_countries.map(c => c.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      
      {/* Custom styling */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: black;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          scroll-behavior: smooth;
          overflow-x: hidden;
        }
        
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: #111827;
        }
        
        ::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 20px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }

        /* Line clamp utility */
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

MovieDetails.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onBack: PropTypes.func,
};

MovieDetails.defaultProps = {
  onBack: () => {},
};

export default memo(MovieDetails);