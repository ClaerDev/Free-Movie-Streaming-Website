import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';

const RatingCircle = ({ rating }) => {
  const percentage = (rating / 10) * 100;

  return (
    <div className="relative w-8 h-8 bg-black backdrop-blur-sm rounded-full flex items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute w-full h-full -rotate-90">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#444"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={rating >= 7 ? '#22c55e' : rating >= 5 ? '#eab308' : '#ef4444'}
          strokeWidth="3"
          strokeDasharray={`${percentage}, 100`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="text-white text-xs font-bold z-10">
        {rating ? `${Math.round(rating * 10)}%` : 'N/A'}
      </span>
    </div>
  );
};

const ContentCard = memo(({
  title,
  poster,
  rating,
  onClick = () => {},
  className = '',
  placeholderImage = '/assets/images/placeholder.jpg',
  releaseDate,
}) => {
  const [imageState, setImageState] = useState({
    isLoading: true,
    hasError: false,
  });

  const handleImageState = useCallback((type) => {
    setImageState((prev) => ({
      ...prev,
      isLoading: type === 'loading',
      hasError: type === 'error',
    }));
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  const imageSrc = imageState.hasError ? placeholderImage : poster;
  const currentDate = new Date();
  const isReleased = releaseDate ? new Date(releaseDate) <= currentDate : true;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full overflow-hidden rounded-lg shadow-lg cursor-pointer
         transition-transform  mr-4 ml-4  duration-300 ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label={`${title} - Rating: ${rating || 'N/A'}`}
    >
      <div className="relative w-full aspect-[2/3]">
        {imageState.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90">
            <div className="animate-pulse rounded-lg w-full h-full bg-gray-700/50" />
          </div>
        )}
        <img
          src={imageSrc}
          alt={`${title} poster`}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageState.isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          onLoad={() => handleImageState('loaded')}
          onError={() => handleImageState('error')}
        />
        {!isReleased && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
            Coming Soon
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <FaPlay className="text-white text-2xl transform group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2">
          <RatingCircle rating={rating} />
        </div>
      </div>
      <div className="p-2 space-y-1">
        <h3 className="text-white text-sm font-medium line-clamp-1">
          {title}
        </h3>
        {releaseDate && (
          <span className="text-gray-400 text-xs">
            {new Date(releaseDate).getFullYear()}
          </span>
        )}
      </div>
    </motion.div>
  );
});

RatingCircle.propTypes = {
  rating: PropTypes.number,
};

ContentCard.propTypes = {
  title: PropTypes.string.isRequired,
  poster: PropTypes.string.isRequired,
  rating: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  placeholderImage: PropTypes.string,
  releaseDate: PropTypes.string,
};

ContentCard.displayName = 'ContentCard';
export default ContentCard;
