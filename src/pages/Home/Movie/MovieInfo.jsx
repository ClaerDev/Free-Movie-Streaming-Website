

const MovieInfo = ({ title, releaseDate, genres, voteAverage }) => (
    <header className="text-xl   font-bold mb-2 text-white">
        {title}
        <p className="text-gray-400 text-sm mb-1">
            Released: {releaseDate} | Genres: {genres.join(', ')}
        </p>
        <p className="text-yellow-500 mb-2">⭐ {voteAverage}</p>
    </header>
);
export default MovieInfo ;