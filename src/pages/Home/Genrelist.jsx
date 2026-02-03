import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { fetchGenres } from './tmdb';
import { motion } from 'framer-motion';

function GenreList({ type, onGenreSelect }) {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const genreRefs = useRef([]);

  useEffect(() => {
    const getGenres = async () => {
      try {
        const genreData = await fetchGenres(type);
        setGenres(genreData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    getGenres();
  }, [type]);

  useEffect(() => {
    if (genreRefs.current[activeIndex]) {
      genreRefs.current[activeIndex].focus({ preventScroll: true });
    }
  }, [activeIndex]);

  const handleKeyDown = (e) => {
    if (loading || error) return;
    let newIndex = activeIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (activeIndex + 1) % genres.length;
        break;
      case 'ArrowLeft':
        newIndex = (activeIndex - 1 + genres.length) % genres.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onGenreSelect(genres[activeIndex].id);
        break;
      default:
        break;
    }
    setActiveIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="sticky top-0 z-50 h-10 sm:h-12  backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-purple-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sticky top-0 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-2">
        <p className="text-xs sm:text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-60 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-2 py-1.5 sm:py-2">
        <motion.ul
          className="flex flex-wrap gap-1.5 sm:gap-2 items-center justify-start overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          variants={{
            show: {
              transition: { staggerChildren: 0.05 }
            }
          }}
          initial="hidden"
          animate="show"
          onKeyDown={handleKeyDown}
        >
          {genres.map((genre, index) => (
            <motion.li
              key={genre.id}
              ref={(el) => (genreRefs.current[index] = el)}
              variants={{
                hidden: { opacity: 0, scale: 0.2 },
                show: { opacity: 1, scale: 1 }
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`
                inline-flex items-center rounded-full 
                px-2.5 py-0.5 sm:px-3 sm:py-1
                text-[10px] sm:text-xs md:text-sm
                font-medium transition-all duration-200
                cursor-pointer select-none whitespace-nowrap
                ${activeIndex === index
                  ? 'bg-black text-white shadow-lg ring-2 ring-red-400'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-purple-600/50 hover:text-white'
                }
              `}
              role="button"
              tabIndex={activeIndex === index ? "0" : "-1"}
              onFocus={() => setActiveIndex(index)}
              onClick={() => onGenreSelect(genre.id)}
            >
              {genre.name}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}

GenreList.propTypes = {
  type: PropTypes.string.isRequired,
  onGenreSelect: PropTypes.func.isRequired,
};

export default GenreList;
