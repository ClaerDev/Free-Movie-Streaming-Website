const API_KEY = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Fetch content by genre — or by custom override params for special categories
 */
export const fetchContentByGenre = async (type, genreId, page = 1, overrideParams = null, sortBy = 'popularity.desc', signal) => {
  try {
    const validPage = Math.min(Math.max(1, Math.floor(page)), 500);
    const isSpecialCategory = genreId != null && genreId < 0;
    const isDonghuaCategory = type === 'tv' && genreId === -4;
    const isPopularitySort = sortBy === 'popularity.desc';
    const isMoviePopularitySort = type === 'movie' && isPopularitySort;
    const isMovieNewestSort = type === 'movie' && sortBy === 'primary_release_date.desc';
    const isTvNewestSort = type === 'tv' && sortBy === 'first_air_date.desc';
    const isTvPopularitySort = type === 'tv' && sortBy === 'popularity.desc';
    const isTvTopRatedSort = type === 'tv' && sortBy.startsWith('vote_average');
    const today = new Date().toISOString().slice(0, 10);

    // Relax vote floors on deeper pages for special categories so scrolling stays long.
    const specialTopRatedMinVotes = isDonghuaCategory
      ? (validPage <= 3 ? 12 : validPage <= 10 ? 6 : 2)
      : (validPage <= 3 ? 35 : validPage <= 10 ? 20 : 8);
    const tvPopularMinVotes = isSpecialCategory
      ? (isDonghuaCategory ? (validPage <= 3 ? 8 : 2) : (validPage <= 3 ? 20 : 8))
      : (validPage <= 3 ? 80 : validPage <= 10 ? 40 : 20);
    const moviePopularMinVotes = isSpecialCategory
      ? (validPage <= 3 ? 25 : 10)
      : (validPage <= 3 ? 120 : validPage <= 10 ? 60 : 25);

    const url = new URL(`${BASE_URL}/discover/${type}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('page', validPage);
    url.searchParams.append('sort_by', sortBy);
    url.searchParams.append('include_adult', 'false');
    // Require minimum votes when sorting by rating to avoid low-vote noise
    if (sortBy.startsWith('vote_average')) {
      url.searchParams.append('vote_count.gte', isSpecialCategory ? String(specialTopRatedMinVotes) : '300');
    } else if (!isPopularitySort) {
      // General floor for Newest/Oldest on generic genres
      if (!isSpecialCategory) url.searchParams.append('vote_count.gte', '50');
    }

    // Keep TV top-rated results realistic and avoid sparse lists with invalid/future dates.
    if (isTvTopRatedSort) {
      if (!isDonghuaCategory) {
        url.searchParams.append('include_null_first_air_dates', 'false');
        url.searchParams.append('first_air_date.lte', today);
      }
    }

    // Keep "Newest" practical: only aired shows with real dates and minimum traction.
    if (isTvNewestSort) {
      url.searchParams.append('include_null_first_air_dates', 'false');
      url.searchParams.append('first_air_date.lte', today);
      url.searchParams.append('vote_count.gte', '50');
    }
    
    if (isMovieNewestSort) {
      url.searchParams.append('primary_release_date.lte', today);
      url.searchParams.append('vote_count.gte', '50');
    }

    // Improve "Most Popular" quality for TV by filtering out low-signal or unaired records.
    if (isTvPopularitySort) {
      if (!isDonghuaCategory) {
        url.searchParams.append('include_null_first_air_dates', 'false');
        url.searchParams.append('first_air_date.lte', today);
      }
      url.searchParams.append('vote_count.gte', String(tvPopularMinVotes));
    }

    // Improve movie "Most Popular" by excluding future/low-signal releases.
    if (isMoviePopularitySort) {
      url.searchParams.append('primary_release_date.lte', today);
      url.searchParams.append('vote_count.gte', String(moviePopularMinVotes));
    }

    if (overrideParams) {
      Object.entries(overrideParams).forEach(([k, v]) => url.searchParams.append(k, v));
    } else if (genreId) {
      url.searchParams.append('with_genres', genreId);
    }

    const response = await fetch(url, { signal });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch ${type}s`);
    }

    const data = await response.json();
    const filteredResults = isPopularitySort
      ? (data.results ?? []).filter((item) => Boolean(item.poster_path))
      : (data.results ?? []);

    return filteredResults;
  } catch (error) {
    const formattedType = typeof type === 'string' && type.length > 0
      ? type.charAt(0).toUpperCase() + type.slice(1)
      : 'Content';
    throw new Error(`${formattedType} fetch failed: ${error.message}`);
  }
};

/**
 * Fetch trending content (movie or tv) for a given time window
 */
export const fetchTrending = async (type, page = 1, timeWindow = 'week', signal) => {
  try {
    const validPage = Math.min(Math.max(1, Math.floor(page)), 500);
    const url = new URL(`${BASE_URL}/trending/${type}/${timeWindow}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('page', validPage);

    const response = await fetch(url, { signal });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch trending ${type}`);
    }
    const data = await response.json();
    return data.results;
  } catch (error) {
    throw new Error(`Trending fetch failed: ${error.message}`);
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
    url.searchParams.append('append_to_response', 'credits');

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
    url.searchParams.append('append_to_response', 'credits');

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

/**
 * Fetch actor/crew details and combined credits.
 * @param {number} personId - The ID of the person
 */
export const fetchPersonDetails = async (personId) => {
  try {
    const url = new URL(`${BASE_URL}/person/${personId}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'en-US');
    url.searchParams.append('append_to_response', 'combined_credits');

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.status_message || `Failed to fetch person details`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Person fetch failed: ${error.message}`);
  }
};

