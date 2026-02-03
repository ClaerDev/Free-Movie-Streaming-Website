import { useState, useEffect, useCallback } from 'react';
import Movie from './Movie/Movie';
import Series from './TV/Series';
import MovieDetails from './Movie/MovieDetails';
import TvDetails from './TV/TvDetails';
import { useMovie } from './MoviesContext';
import { useSeries } from './SeriesContext';
import { BiMovie, BiCameraMovie, BiUpArrowAlt } from 'react-icons/bi';
import { SeriesProvider } from './SeriesContext';
import { MovieProvider } from './MoviesContext';
import Navbar from './Navbar';
import Loadingspinner from './resused/Loadingspinner';

const MainContent = ({ activePage, isLoading }) => {
  const { selectedMovie, selectMovie } = useMovie();
  const { selectedSeries, selectSeries } = useSeries();

  const closeDetails = () => {
    selectMovie(null);
    selectSeries(null);
  };

  const showNavigation = !selectedMovie && !selectedSeries; // Only show navigation buttons when no details are selected

  return (
    <main className={`w-full transition-all duration-500 ${showNavigation ? 'pt-20' : 'pt-4'}`}>
      {/* Show movie or series list only when neither movie nor series details are selected */}
      {showNavigation && (
        <div className="gap-12">
          {activePage === 'movies' && <Movie />}
          {activePage === 'series' && <Series />}
        </div>
      )}

      {/* Show details when movie or series is selected */}
      {(selectedMovie || selectedSeries) && (
        <div className="animate-fadeIn px-4 md:px-8 lg:px-16 py-8">
          <button
            onClick={closeDetails}
            className="mb-10 px-3 py-1.5 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <svg
              className="w-3 h-3 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium tracking-wide">Back</span>
          </button>
          {selectedMovie ? (
            <MovieDetails movieId={selectedMovie.id} closeDetails={closeDetails} />
          ) : (
            <TvDetails tvId={selectedSeries.id} closeDetails={closeDetails} />
          )}
        </div>
      )}
      {isLoading && !selectedMovie && !selectedSeries && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Loadingspinner />
        </div>
      )}
    </main>
  );
};

function ParentComponent() {
  const [activePage, setActivePage] = useState('movies');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (page) => {
    setIsLoading(true);
    setCurrentPage(page);
    setTimeout(() => {
      setIsLoading(false);
    }, 400); // Simulating loading for navigation
    setActivePage(page);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  return (
    <SeriesProvider>
      <MovieProvider>
        <AppContent
          activePage={activePage}
          scrollPosition={scrollPosition}
          isLoading={isLoading}
          handleNavigation={handleNavigation}
          handlePageChange={handlePageChange}
          scrollToTop={scrollToTop}
        />
      </MovieProvider>
    </SeriesProvider>
  );
}

const AppContent = ({ activePage, scrollPosition, isLoading, handleNavigation, handlePageChange, scrollToTop }) => {
  const { selectedMovie, selectMovie } = useMovie();
  const { selectedSeries, selectSeries } = useSeries();
  const showNavbar = !selectedMovie && !selectedSeries;

  return (
    <div className="min-h-screen relative text-white">
      {/* Navbar */}
      <nav className={`top-0 left-0 fixed w-full shadow-lg z-50 bg-black/90 ${!showNavbar ? 'hidden' : ''}`}>
        <Navbar onNavigate={handleNavigation} activePage={activePage} onPageChange={handlePageChange} />
      </nav>

      {/* Navigation Buttons */}
      {!selectedMovie && !selectedSeries && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-40 flex gap-4">
          <button
            onClick={() => handleNavigation('movies')}
            className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-white rounded-xl font-medium text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl ${activePage === 'movies'
                ? 'bg-orange-600 shadow-orange-500/30'
                : 'bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm'
              }`}
          >
            <BiMovie className="text-xl sm:text-2xl" />
            Movies
          </button>
          <button
            onClick={() => handleNavigation('series')}
            className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-white rounded-xl font-medium text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl ${activePage === 'series'
                ? 'bg-orange-600 shadow-orange-500/30'
                : 'bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm'
              }`}
          >
            <BiCameraMovie className="text-xl sm:text-2xl" />
            Series
          </button>
        </div>
      )}

      {/* Floating Scroll Button */}
      {scrollPosition > 300 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-50 hover:bg-gradient-to-r from-red-6 to-pink-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300"
          aria-label="Scroll to Top"
        >
          <BiUpArrowAlt className="text-2xl" />
        </button>
      )}

      {/* Main Content */}
      <MainContent activePage={activePage} isLoading={isLoading} />
    </div>
  );
};

export default ParentComponent;
