import { createContext, useContext, useState } from 'react';

const SeriesContext = createContext();

export const useSeries = () => {
  const context = useContext(SeriesContext);
  if (!context) {
    throw new Error('useSeries must be used within a SeriesProvider');
  }
  return context;
};

export const SeriesProvider = ({ children }) => {
  const [selectedSeries, setSelectedSeries] = useState(null);

  const selectSeries = (series) => {
    setSelectedSeries(series);
  };

  const value = {
    selectedSeries,
    selectSeries,
  };

  return <SeriesContext.Provider value={value}>{children}</SeriesContext.Provider>;
};
