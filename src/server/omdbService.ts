import dotenv from 'dotenv';
if (typeof process !== 'undefined' && typeof process?.cwd === 'function') {
  dotenv.config();
}

import type { MovieDetail, MovieSearchResult, MovieSummary } from '../types';

// Curated high-fidelity demonstration catalog with verified IMDb IDs and backdrops
// Curated demonstration catalog imported from shared data
import { CURATED_MOVIES } from "../data/curatedMovies";
export { CURATED_MOVIES };

const OMDB_TIMEOUT_MS = 7000;
const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

// In-Memory Caches with TTL to protect rate limits and enhance speed
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<MovieSearchResult>>();
const detailCache = new Map<string, CacheEntry<MovieDetail>>();

const SEARCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const DETAIL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Basic rate limiting tracker (sliding window)
const rateLimitTracker = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 40;

export function checkRateLimit(ip = 'client'): boolean {
  const now = Date.now();
  const timestamps = rateLimitTracker.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitTracker.set(ip, validTimestamps);
  return true;
}

function getSafeApiKey(): string | null {
  const envKey = process.env.OMDB_API_KEY;
  if (envKey && envKey !== 'replace_with_your_omdb_api_key' && envKey !== 'YOUR_OMDB_API_KEY' && envKey !== 'MY_OMDB_API_KEY') {
    return envKey.trim();
  }
  // Never embed a real API key in source. Missing credentials use the demo catalog.
  return null;
}

/**
 * Search movies via OMDb with caching, timeouts, and normalization
 */
export async function searchMovies(query: string, page = 1): Promise<MovieSearchResult> {
  const sanitizedQuery = (query || '').trim();

  // Validate search query
  if (!sanitizedQuery) {
    return {
      Search: [],
      totalResults: '0',
      Response: 'False',
      Error: 'Please provide a non-empty search query.',
      source: 'demo'
    };
  }

  if (sanitizedQuery.length > 100) {
    return {
      Search: [],
      totalResults: '0',
      Response: 'False',
      Error: 'Search query exceeds maximum allowed length of 100 characters.',
      source: 'demo'
    };
  }

  const validPage = Math.max(1, Math.min(100, isNaN(page) ? 1 : page));
  const cacheKey = `search:${sanitizedQuery.toLowerCase()}:${validPage}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return cached.data;
  }

  const apiKey = getSafeApiKey();

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OMDB_TIMEOUT_MS);

      // Construct upstream request using URLSearchParams
      const params = new URLSearchParams({
        apikey: apiKey,
        s: sanitizedQuery,
        page: String(validPage),
        type: 'movie'
      });

      const url = `https://www.omdbapi.com/?${params.toString()}`;

      // Secure log (never exposing key)
      console.log(`[OMDb API] GET /?s=${encodeURIComponent(sanitizedQuery)}&page=${validPage}`);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        if (data.Response === 'True' && Array.isArray(data.Search)) {
          // Normalize results
          const searchResults: MovieSummary[] = data.Search.map((m: any) => {
            const hasPoster = m.Poster && m.Poster !== 'N/A' && m.Poster.startsWith('http');
            const posterUrl = hasPoster ? m.Poster : FALLBACK_POSTER;
            return {
              imdbID: m.imdbID,
              title: m.Title || 'Untitled Movie',
              Title: m.Title || 'Untitled Movie',
              year: m.Year || 'N/A',
              Year: m.Year || 'N/A',
              type: m.Type || 'movie',
              Type: m.Type || 'movie',
              poster: posterUrl,
              Poster: posterUrl,
              source: 'omdb'
            };
          });

          const result: MovieSearchResult = {
            Search: searchResults,
            totalResults: data.totalResults || String(searchResults.length),
            Response: 'True',
            source: 'omdb'
          };

          // Store in cache
          searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        } else if (data.Error) {
          // If OMDb says movie not found, check curated fallback for matches
          const curatedMatches = CURATED_MOVIES.filter(
            (m) =>
              m.title.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
              m.genre.toLowerCase().includes(sanitizedQuery.toLowerCase())
          );

          if (curatedMatches.length > 0) {
            const fallbackResult: MovieSearchResult = {
              Search: curatedMatches.map((m) => ({
                imdbID: m.imdbID,
                title: m.title,
                Title: m.Title,
                year: m.year,
                Year: m.Year,
                type: 'movie',
                Type: 'movie',
                poster: m.poster,
                Poster: m.Poster,
                genre: m.genre,
                imdbRating: m.imdbRating,
                plot: m.plot,
                source: 'demo'
              })),
              totalResults: String(curatedMatches.length),
              Response: 'True',
              source: 'demo',
              isFallback: true,
              fallbackNotice: `OMDb returned: "${data.Error}". Showing curated demonstration catalog.`
            };
            return fallbackResult;
          }

          return {
            Search: [],
            totalResults: '0',
            Response: 'False',
            Error: data.Error,
            source: 'omdb'
          };
        }
      }
    } catch (err: any) {
      console.warn('[OMDb API] Upstream search warning:', err?.message || err);
    }
  }

  // Fallback to local curated catalog
  const filtered = CURATED_MOVIES.filter(
    (m) =>
      m.title.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
      m.genre.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
      (m.director && m.director.toLowerCase().includes(sanitizedQuery.toLowerCase())) ||
      (m.actors && m.actors.toLowerCase().includes(sanitizedQuery.toLowerCase()))
  );

  return {
    Search: filtered.map((m) => ({
      imdbID: m.imdbID,
      title: m.title,
      Title: m.Title,
      year: m.year,
      Year: m.Year,
      type: 'movie',
      Type: 'movie',
      poster: m.poster,
      Poster: m.Poster,
      genre: m.genre,
      imdbRating: m.imdbRating,
      plot: m.plot,
      source: 'demo'
    })),
    totalResults: String(filtered.length),
    Response: filtered.length > 0 ? 'True' : 'False',
    Error: filtered.length > 0 ? undefined : 'No movies found matching your query.',
    source: 'demo',
    isFallback: true,
    fallbackNotice: 'Demonstration catalogue displayed (live OMDb unavailable or rate limit reached).'
  };
}

/**
 * Fetch detailed movie record via OMDb by IMDb ID
 */
export async function getMovieDetails(imdbId: string): Promise<MovieDetail | null> {
  const sanitizedId = (imdbId || '').trim();

  // Validate IMDb ID format
  if (!sanitizedId || !/^tt\d{5,10}$/.test(sanitizedId)) {
    const foundDemo = CURATED_MOVIES.find((m) => m.imdbID === sanitizedId);
    return foundDemo || null;
  }

  // Check detail cache
  const cached = detailCache.get(sanitizedId);
  if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL) {
    return cached.data;
  }

  const apiKey = getSafeApiKey();

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OMDB_TIMEOUT_MS);

      const params = new URLSearchParams({
        apikey: apiKey,
        i: sanitizedId,
        plot: 'full'
      });

      const url = `https://www.omdbapi.com/?${params.toString()}`;
      console.log(`[OMDb API] GET /?i=${encodeURIComponent(sanitizedId)}&plot=full`);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.Response === 'True') {
          const curatedMatch = CURATED_MOVIES.find((m) => m.imdbID === sanitizedId);
          const hasPoster = data.Poster && data.Poster !== 'N/A' && data.Poster.startsWith('http');
          const posterUrl = hasPoster ? data.Poster : curatedMatch?.poster || FALLBACK_POSTER;

          const genresList = data.Genre ? data.Genre.split(', ') : ['Cinema'];

          const normalized: MovieDetail = {
            imdbID: data.imdbID,
            title: data.Title || 'Untitled Movie',
            Title: data.Title || 'Untitled Movie',
            year: data.Year || 'N/A',
            Year: data.Year || 'N/A',
            rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : 'PG-13',
            Rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : 'PG-13',
            released: data.Released || 'N/A',
            Released: data.Released || 'N/A',
            runtime: data.Runtime && data.Runtime !== 'N/A' ? data.Runtime : '120 min',
            Runtime: data.Runtime && data.Runtime !== 'N/A' ? data.Runtime : '120 min',
            genre: data.Genre || 'Cinema',
            Genre: data.Genre || 'Cinema',
            genres: genresList,
            director: data.Director && data.Director !== 'N/A' ? data.Director : 'Information unavailable',
            Director: data.Director && data.Director !== 'N/A' ? data.Director : 'Information unavailable',
            writer: data.Writer || 'N/A',
            Writer: data.Writer || 'N/A',
            actors: data.Actors && data.Actors !== 'N/A' ? data.Actors : 'Cast information unavailable',
            Actors: data.Actors && data.Actors !== 'N/A' ? data.Actors : 'Cast information unavailable',
            plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : 'No detailed plot summary is available for this title.',
            Plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : 'No detailed plot summary is available for this title.',
            language: data.Language || 'English',
            Language: data.Language || 'English',
            country: data.Country || 'International',
            Country: data.Country || 'International',
            awards: data.Awards || 'N/A',
            Awards: data.Awards || 'N/A',
            poster: posterUrl,
            Poster: posterUrl,
            imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.5',
            totalVotes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : 'N/A',
            imdbVotes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : 'N/A',
            type: data.Type || 'movie',
            Type: data.Type || 'movie',
            boxOffice: data.BoxOffice,
            BoxOffice: data.BoxOffice,
            backdropUrl: curatedMatch?.backdropUrl || posterUrl,
            source: 'omdb'
          };

          detailCache.set(sanitizedId, { data: normalized, timestamp: Date.now() });
          return normalized;
        }
      }
    } catch (err: any) {
      console.warn('[OMDb API] Movie detail warning:', err?.message || err);
    }
  }

  // Fallback to curated catalog
  const curated = CURATED_MOVIES.find((m) => m.imdbID === sanitizedId);
  if (curated) {
    return { ...curated, source: 'demo' };
  }

  return null;
}

/**
 * Return curated catalogue using predefined set of verified IMDb IDs
 */
export async function getCuratedCollections(): Promise<{
  featured: MovieDetail;
  trendingNow: MovieDetail[];
  popularMovies: MovieDetail[];
  topRated: MovieDetail[];
  upcoming: MovieDetail[];
  source: 'omdb' | 'demo';
}> {
  const curatedIds = [
    'tt0816692', // Interstellar
    'tt15239678', // Dune: Part Two
    'tt15398776', // Oppenheimer
    'tt0468569', // The Dark Knight
    'tt1375666', // Inception
    'tt9362722', // Spider-Man: Across the Spider-Verse
    'tt4154796', // Avengers: Endgame
    'tt1745960'  // Top Gun: Maverick
  ];

  const fetchedMovies: MovieDetail[] = [];
  let hasOmdbSuccess = false;

  for (const id of curatedIds) {
    try {
      const m = await getMovieDetails(id);
      if (m) {
        fetchedMovies.push(m);
        if (m.source === 'omdb') hasOmdbSuccess = true;
      }
    } catch {
      // ignore individual failures
    }
  }

  const pool = fetchedMovies.length >= 4 ? fetchedMovies : CURATED_MOVIES;
  const source = hasOmdbSuccess ? 'omdb' : 'demo';

  return {
    featured: pool[0] || CURATED_MOVIES[0],
    trendingNow: pool.slice(0, 4),
    popularMovies: pool.slice(2, 6),
    topRated: [pool[3], pool[2], pool[4], pool[0]].filter(Boolean),
    upcoming: [pool[1], pool[5]].filter(Boolean),
    source
  };
}
