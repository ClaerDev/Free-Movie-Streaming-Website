import { useState } from 'react';
import GenreList from '../Genrelist';
import ContentGrid from '../ContentGrid';
import { useSeries } from '../SeriesContext';

function Series() {
  const [selectedGenreId, setSelectedGenreId] = useState(9648);
  const { selectSeries } = useSeries();

  const handleGenreSelect = (genreId) => {
    setSelectedGenreId(genreId);
  };

  const handleSelect = (item) => {
    selectSeries(item); // Updates global SeriesContext
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="w-full shadow-lg mb-5">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <GenreList
              type="tv"
              onGenreSelect={handleGenreSelect}
              selectedGenreId={selectedGenreId}
            />
          </div>
        </div>
      </div>
      <main className="flex-grow pt-6">
        <div className="container mx-auto px-4">
          <ContentGrid
            genreId={selectedGenreId}
            type="tv"
            onSelect={handleSelect}
          />
        </div>
      </main>
    </div>
  );
}

export default Series;
