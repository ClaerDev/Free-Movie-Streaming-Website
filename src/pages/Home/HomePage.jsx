import { useNavigate } from 'react-router-dom';
import { toDetailPath } from './urlUtils';
import HeroBanner from './HeroBanner';
import TrendingRow from './TrendingRow';

export default function HomePage() {
  const navigate = useNavigate();

  const handleSelect = (item, type) => {
    navigate(toDetailPath(type === 'tv' ? 'tv' : 'movie', item.id, item.title || item.name));
  };

  return (
    <div className="bg-black min-h-screen">
      <HeroBanner />
      <div className="pt-10">
        <TrendingRow
          title="Trending Movies"
          type="movie"
          onSelect={handleSelect}
        />
        <TrendingRow
          title="Trending TV Shows"
          type="tv"
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
