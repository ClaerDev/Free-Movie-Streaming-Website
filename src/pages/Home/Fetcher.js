const API_KEY = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Fetch content by genre
 */
export const fetchContentByGenre = async (type, genreId, page = 1) => {
  try {
    const validPage = Math.min(Math.max(1, Math.floor(page)), 500);  // Ensures page is between 1 and 500

    const url = new URL(`${BASE_URL}/discover/${type}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('with_genres', genreId);
    url.searchParams.append('page', validPage);
    url.searchParams.append('language', 'en-US');

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch ${type}s`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    const formattedType = typeof type === 'string' && type.length > 0 
      ? type.charAt(0).toUpperCase() + type.slice(1) 
      : "Content";
    throw new Error(`${formattedType} fetch failed: ${error.message}`);
  }
};

/**
 * Fetch details for a specific movie
 * @param {number} movieId - The ID of the movie
 */
export const fetchMovieDetails = async (movieId) => {
  try {
    const url = new URL(`${BASE_URL}/movie/${movieId}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch movie details`);
    }

    const movieData = await response.json();
    return movieData;
  } catch (error) {
    throw new Error(`Movie details fetch failed: ${error.message}`);
  }
};

/**
 * Fetch related movies based on a specific movie ID
 * @param {number} movieId - The ID of the movie
 */
export const fetchRelatedMovies = async (movieId) => {
  try {
    const url = new URL(`${BASE_URL}/movie/${movieId}/recommendations`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch related movies`);
    }

    const relatedData = await response.json();
    return relatedData.results;
  } catch (error) {
    throw new Error(`Related movies fetch failed: ${error.message}`);
  }
};


/**
 * Fetch details for a specific TV series
 * @param {number} tvId - The ID of the TV series
 */
export const fetchSeriesDetails = async (tvId) => {
  try {
    const url = new URL(`${BASE_URL}/tv/${tvId}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch TV series details`);
    }

    const seriesData = await response.json();
    return seriesData;
  } catch (error) {
    throw new Error(`TV series details fetch failed: ${error.message}`);
  }
};




/**
 * Fetch details for all episodes of each season for a specific TV series
 * @param {number} tvId - The ID of the TV series
 */
export const fetchAllEpisodes = async (tvId) => {
  try {
    const seriesDetails = await fetchSeriesDetails(tvId);
    const { seasons } = seriesDetails;

    const seasonDetailsPromises = seasons.map(async (season) => {
      const url = new URL(`${BASE_URL}/tv/${tvId}/season/${season.season_number}`);
      url.searchParams.append('api_key', API_KEY);
      url.searchParams.append('language', 'en-US');

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.status_message || `Failed to fetch season ${season.season_number}`);
      }

      const seasonData = await response.json();
      return seasonData;  // Contains all episodes for this season
    });

    const allSeasonsDetails = await Promise.all(seasonDetailsPromises);
    return allSeasonsDetails;
  } catch (error) {
    throw new Error(`All episodes fetch failed: ${error.message}`);
  }
};



/**
 * Fetch related series based on a specific TV series ID
 * @param {number} tvId - The ID of the TV series
 */
export const fetchRelatedSeries = async (tvId) => {
  try {
    const url = new URL(`${BASE_URL}/tv/${tvId}/recommendations`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch related TV series`);
    }

    const relatedSeriesData = await response.json();
    return relatedSeriesData.results;
  } catch (error) {
    throw new Error(`Related TV series fetch failed: ${error.message}`);
  }
};
