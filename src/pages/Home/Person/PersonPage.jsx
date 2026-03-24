import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPersonDetails } from '../Fetcher';
import { toDetailPath } from '../urlUtils';
import ContentCard from '../ContentCard';
import SEO from '../SEO';
import { FaArrowLeft } from 'react-icons/fa';

export default function PersonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPersonDetails(id)
      .then(data => {
        if (!cancelled) {
          setPerson(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError("Failed to load person details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const sortedCredits = useMemo(() => {
    if (!person?.combined_credits?.cast) return [];
    // Sort by popularity instead of release date, or a mix of popularity and vote_count to ensure good quality stuff is at top
    // deduplicate by id
    const seen = new Set();
    const unique = [];
    for (const item of person.combined_credits.cast) {
        if (!seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
        }
    }
    
    return unique
      .filter(item => item.poster_path && !item.adult)
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)) // Sort by vote count to show most recognizable works
      .slice(0, 48);
  }, [person]);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  const handleSelect = (item) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    navigate(toDetailPath(type, item.id, item.title || item.name), {
      state: { from: location.pathname + location.search }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080a] flex justify-center pt-32 p-6">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-6">
        <div className="bg-red-900/10 border border-red-700/30 rounded-2xl p-8 max-w-sm w-full text-center backdrop-blur-md">
          <p className="text-red-400 mb-6 font-medium">{error}</p>
          <button onClick={() => navigate(-1)} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#07080a] text-white pt-24 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-16"
    >
      <SEO 
        title={`${person.name} — WeFlix`} 
        description={person.biography || `Discover movies and TV shows starring ${person.name}.`}
        image={person.profile_path ? `https://image.tmdb.org/t/p/w780${person.profile_path}` : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-full transition-all duration-300 w-fit mb-8"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 mb-16">
          {/* Profile Picture */}
          <div className="w-48 sm:w-64 md:w-72 lg:w-80 shrink-0 mx-auto md:mx-0">
            <div className="w-full aspect-[2/3] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 sm:sticky sm:top-24">
              {person.profile_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/h632${person.profile_path}`} 
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium bg-[#111827]">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight drop-shadow-lg">{person.name}</h1>
            
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-400 mb-8">
              {person.known_for_department && (
                <span className="bg-red-600/20 text-red-500 px-3 py-1 rounded-full border border-red-500/30">
                  {person.known_for_department}
                </span>
              )}
              {person.birthday && (
                <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-full border border-white/10">
                  Born: {person.birthday}
                </span>
              )}
              {person.place_of_birth && (
                <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-full border border-white/10">
                  {person.place_of_birth}
                </span>
              )}
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-red-500 rounded-full inline-block"></span>
                Biography
              </h3>
              {person.biography ? (
                <div className="text-gray-300 text-sm md:text-base leading-relaxed tracking-wide opacity-90 space-y-4">
                  {person.biography.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">We don't have a biography for {person.name}.</p>
              )}
            </div>
          </div>
        </div>

        {/* Known For Grid */}
        {sortedCredits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <span className="w-1.5 h-6 bg-red-500 rounded-full inline-block"></span>
                Known For
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {sortedCredits.map((item, idx) => (
                <ContentCard
                  key={`${item.id}-${idx}`}
                  title={item.title || item.name}
                  poster={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/placeholder.svg'}
                  rating={item.vote_average}
                  mediaId={item.id}
                  releaseDate={item.release_date || item.first_air_date}
                  mediaType={item.media_type === 'tv' ? 'tv' : 'movie'}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                  onClick={() => handleSelect({ ...item, media_type: item.media_type === 'tv' ? 'tv' : 'movie' })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
