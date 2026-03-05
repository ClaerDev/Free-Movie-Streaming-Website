import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BiUpArrowAlt, BiHomeAlt, BiMoviePlay, BiTv, BiSearch } from 'react-icons/bi';
import Sidebar from './Sidebar';

function ParentComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = useCallback(() => setScrollPosition(window.scrollY), []);
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const activePage =
    location.pathname === '/'                  ? 'home'
    : location.pathname.startsWith('/movies')  ? 'movies'
    : location.pathname.startsWith('/series')  ? 'series'
    : location.pathname.startsWith('/search')  ? 'search'
    : location.pathname.startsWith('/movie/')  ? 'movies'
    : location.pathname.startsWith('/tv/')     ? 'series'
    : 'home';

  const selectedGenreId = searchParams.get('genre')
    ? Number(searchParams.get('genre'))
    : null;

  const handleNavigation = (page) => {
    if (page === 'home')        navigate('/');
    else if (page === 'movies') navigate('/movies');
    else if (page === 'series') navigate('/series');
    else                        navigate(`/${page}`);
  };

  const handleGenreSelect = (genreId) => {
    setSearchParams({ genre: genreId });
  };

  return (
    <div className="min-h-screen relative text-white">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        selectedGenreId={selectedGenreId}
        onGenreSelect={handleGenreSelect}
      />

      {scrollPosition > 300 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 right-4 z-50 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 shadow-lg hover:scale-110 transition-all duration-300"
          aria-label="Scroll to Top"
        >
          <BiUpArrowAlt className="text-2xl" />
        </button>
      )}

      {/* Page content */}
      <div className="md:pl-[84px] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />

        {/* Footer — home page only */}
        {location.pathname === '/' && <footer className="bg-[#0a0c12]">
          {/* Top gradient divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="max-w-5xl mx-auto px-6 pt-12 pb-8">

            {/* Main row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-10">

              {/* Brand block */}
              <div className="flex flex-col items-center sm:items-start gap-3">
                <span className="text-2xl font-black tracking-tight">
                  We<span className="text-red-500">Flix</span>
                </span>
                <p className="text-gray-500 text-xs leading-relaxed text-center sm:text-left max-w-[220px]">
                  Free streaming powered by TMDB.<br />For entertainment purposes only.
                </p>
                <p className="text-gray-600 text-[11px]">
                  Developed by <span className="text-gray-400 font-semibold">Phyo Min Thein</span>
                </p>
              </div>

              {/* Nav links */}
              <div className="flex flex-col items-center sm:items-start gap-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1">Browse</p>
                {[
                  { label: 'Home',     page: 'home'   },
                  { label: 'Movies',   page: 'movies' },
                  { label: 'TV Shows', page: 'series' },
                  { label: 'Search',   page: 'search' },
                ].map(({ label, page }) => (
                  <button
                    key={page}
                    onClick={() => handleNavigation(page)}
                    className="text-gray-500 hover:text-white text-sm transition-colors duration-150"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 pt-5 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-600">
              <span>© {new Date().getFullYear()} WeFlix. All rights reserved.</span>
              <span>
                Movie &amp; TV data by{' '}
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors"
                >
                  TMDB
                </a>
              </span>
            </div>
          </div>
        </footer>}
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f18]/95 backdrop-blur-md border-t border-white/[0.07] flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {[
          { id: 'home',   icon: BiHomeAlt,   label: 'Home'    },
          { id: 'movies', icon: BiMoviePlay, label: 'Movies'  },
          { id: 'series', icon: BiTv,        label: 'TV'      },
          { id: 'search', icon: BiSearch,    label: 'Search'  },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigation(id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default ParentComponent;
