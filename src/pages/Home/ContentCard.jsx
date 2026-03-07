import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FaPlay, FaStar } from 'react-icons/fa';

const ContentCard = memo(({
  title,
  poster,
  rating,
  onClick = () => { },
  className = '',
  placeholderImage = '/placeholder.svg',
  releaseDate,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  const src = imageError ? placeholderImage : poster;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const ratingNum = rating ? Math.round(rating * 10) : null;
  const ratingColor = rating >= 7 ? 'text-green-400' : rating >= 5 ? 'text-yellow-400' : 'text-red-400';

  return (
    <motion.div
      whileHover={{ scale: 1.07, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative w-full cursor-pointer rounded-xl overflow-hidden
        ring-1 ring-white/5 hover:ring-white/20 hover:shadow-2xl hover:shadow-black/60
        transition-shadow duration-200 ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
    >
      {/* Poster */}
      <div className="relative w-full aspect-[2/3] bg-[#111827]">
        {/* Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/5 to-white/[0.02]" />
        )}

        <img
          src={src}
          alt={title}
          className={`w-full h-full object-cover transition-opacity duration-400 ${imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => { setImageError(true); setImageLoaded(true); }}
        />

        {/* Always-visible bottom gradient + title */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Rating badge — top right */}
        {ratingNum && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm
            text-[11px] font-bold px-1.5 py-0.5 rounded-md">
            <FaStar className={`text-[9px] ${ratingColor}`} />
            <span className={ratingColor}>{ratingNum}%</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200
          flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30
            flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <FaPlay className="text-white text-sm ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info below poster */}
      <div className="px-2.5 pt-2 pb-2.5 bg-[#0d1117]">
        <p className="text-white text-[13px] font-semibold leading-tight line-clamp-1">{title}</p>
        {year && <p className="text-gray-500 text-[11px] mt-0.5">{year}</p>}
      </div>
    </motion.div>
  );
});

ContentCard.propTypes = {
  title: PropTypes.string.isRequired,
  poster: PropTypes.string,
  rating: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  placeholderImage: PropTypes.string,
  releaseDate: PropTypes.string,
};

ContentCard.displayName = 'ContentCard';
export default ContentCard;
