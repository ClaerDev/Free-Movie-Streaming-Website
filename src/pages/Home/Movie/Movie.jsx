import { useState } from 'react';
import GenreList from '../Genrelist';
import ContentGrid from '../ContentGrid';
import { useMovie } from '../MoviesContext';

function Movie() {
  const [selectedGenreId, setSelectedGenreId] = useState(28);
  const { selectMovie } = useMovie();

  const handleGenreSelect = (genreId) => {
    setSelectedGenreId(genreId);
  };

  const handleSelect = (item) => {
    selectMovie(item); // Updates global MovieContext
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full shadow-lg mb-5">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <GenreList
              type="movie"
              onGenreSelect={handleGenreSelect}
              selectedGenreId={selectedGenreId}
            />
          </div>
        </div>
      </div>
      <main className="flex-grow pt-2">
        <div className="container mx-auto px-4">
          <ContentGrid
            genreId={selectedGenreId}
            type="movie"
            onSelect={handleSelect}
          />
        </div>
      </main>
    </div>
  );
}

export default Movie;
