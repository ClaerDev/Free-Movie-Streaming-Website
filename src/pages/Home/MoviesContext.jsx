import { createContext, useContext, useState } from 'react';

const MovieContext = createContext();

export const useMovie = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovie must be used within a MovieProvider');
  }
  return context;
};

export const MovieProvider = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);

  const selectMovie = (movie) => {
    setSelectedMovie(movie);
  };

  const value = {
    selectedMovie,
    selectMovie,
  };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
};
