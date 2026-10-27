import type { MovieDetail, MovieSearchResult } from '../types';
import { DEMO_MOVIES, FEATURED_HERO_MOVIE } from '../data/demoMovies';

/**
 * Centralized API Service for IMovies
 * All requests route through the secure Express backend proxy (/api/*).
 * The OMDb API key is never exposed to the client.
 */

export async function fetchHealth(): Promise<{
  status: string;
  service: string;
  timestamp: string;
  omdbConfigured: boolean;
  version: string;
}> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error('Health check endpoint failed');
  }
  return await res.json();
}

export async function getCuratedMovies(): Promise<{
  featured: MovieDetail;
  trendingNow: MovieDetail[];
  popularMovies: MovieDetail[];
  topRated: MovieDetail[];
  upcoming: MovieDetail[];
  source: 'omdb' | 'demo';
}> {
  try {
    const res = await fetch('/api/curated');
    if (res.ok) {
      const data = await res.json();
      if (data && data.featured) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[movieApi] Failed to load curated list from backend, using demonstration catalog:', err);
  }

  // Graceful fallback to centralized demonstration data
  const fallbackList: MovieDetail[] = DEMO_MOVIES.map((m) => ({
    imdbID: m.id,
    title: m.title,
    Title: m.title,
    year: m.year,
    Year: m.year,
    rated: 'PG-13',
    Released: m.releaseDate || '2024',
    released: m.releaseDate || '2024',
    runtime: m.runtime || '120 min',
    Runtime: m.runtime || '120 min',
    genre: m.genres.join(', '),
    Genre: m.genres.join(', '),
    genres: m.genres,
    director: m.director || 'Director',
    actors: m.cast || 'Cast',
    plot: m.description,
    Plot: m.description,
    language: 'English',
    country: 'United States',
    poster: m.posterUrl,
    Poster: m.posterUrl,
    imdbRating: m.rating,
    backdropUrl: m.backdropUrl,
    source: 'demo'
  }));

  return {
    featured: fallbackList[0],
    trendingNow: fallbackList.slice(0, 4),
    popularMovies: fallbackList.slice(2, 6),
    topRated: [fallbackList[3], fallbackList[2], fallbackList[4], fallbackList[0]].filter(Boolean),
    upcoming: fallbackList.filter((_, idx) => idx % 2 === 1).slice(0, 4),
    source: 'demo'
  };
}

export async function searchMovies(
  query: string,
  page = 1,
  signal?: AbortSignal
): Promise<MovieSearchResult> {
  const sanitizedQuery = (query || '').trim();
  if (!sanitizedQuery) {
    return {
      Search: [],
      totalResults: '0',
      Response: 'False',
      Error: 'Please enter a movie title to search.',
      source: 'demo'
    };
  }

  try {
    const res = await fetch(
      `/api/movies/search?q=${encodeURIComponent(sanitizedQuery)}&page=${page}`,
      { signal }
    );
    const data: MovieSearchResult = await res.json();
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    console.warn('[movieApi] Search request failed, falling back to local demo search:', err);

    // Fallback to local demonstration search
    const matched = DEMO_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
        m.genres.some((g) => g.toLowerCase().includes(sanitizedQuery.toLowerCase())) ||
        (m.director && m.director.toLowerCase().includes(sanitizedQuery.toLowerCase()))
    );

    return {
      Search: matched.map((m) => ({
        imdbID: m.id,
        title: m.title,
        Title: m.title,
        year: m.year,
        Year: m.year,
        type: 'movie',
        Type: 'movie',
        poster: m.posterUrl,
        Poster: m.posterUrl,
        genre: m.genres.join(', '),
        Genre: m.genres.join(', '),
        imdbRating: m.rating,
        source: 'demo'
      })),
      totalResults: String(matched.length),
      Response: matched.length > 0 ? 'True' : 'False',
      Error: matched.length > 0 ? undefined : 'No matching movies found.',
      source: 'demo',
      isFallback: true,
      fallbackNotice: 'Showing matching movies from demonstration catalog.'
    };
  }
}

export async function getMovieDetails(imdbId: string): Promise<MovieDetail> {
  const sanitizedId = (imdbId || '').trim();
  if (!sanitizedId) {
    throw new Error('Invalid movie identifier.');
  }

  try {
    const res = await fetch(`/api/movies/${encodeURIComponent(sanitizedId)}`);
    if (res.ok) {
      const data: MovieDetail = await res.json();
      return data;
    }
    const errData = await res.json().catch(() => ({}));
    if (errData.Error) {
      throw new Error(errData.Error);
    }
  } catch (err: any) {
    console.warn(`[movieApi] Backend detail request failed for ${sanitizedId}:`, err);
  }

  // Fallback check against local demonstration movies
  const foundDemo = DEMO_MOVIES.find((m) => m.id === sanitizedId);
  if (foundDemo) {
    return {
      imdbID: foundDemo.id,
      title: foundDemo.title,
      Title: foundDemo.title,
      year: foundDemo.year,
      Year: foundDemo.year,
      rated: 'PG-13',
      released: foundDemo.releaseDate || 'N/A',
      runtime: foundDemo.runtime || '120 min',
      genre: foundDemo.genres.join(', '),
      Genre: foundDemo.genres.join(', '),
      genres: foundDemo.genres,
      director: foundDemo.director || 'N/A',
      actors: foundDemo.cast || 'N/A',
      plot: foundDemo.description,
      Plot: foundDemo.description,
      language: 'English',
      country: 'United States',
      poster: foundDemo.posterUrl,
      Poster: foundDemo.posterUrl,
      imdbRating: foundDemo.rating,
      backdropUrl: foundDemo.backdropUrl,
      source: 'demo'
    };
  }

  throw new Error(`Movie with identifier "${sanitizedId}" could not be retrieved.`);
}

// Backward-compatible exports
export const fetchCuratedMovies = getCuratedMovies;
export const fetchMovieSearch = searchMovies;
export const fetchMovieDetail = getMovieDetails;

// ==========================================
// CINEMA, SHOWTIMES & BOOKING API FUNCTIONS
// ==========================================

import type { Cinema, Show, Booking, SeatCategory } from '../types';

export async function fetchCinemas(): Promise<Cinema[]> {
  const res = await fetch('/api/cinemas');
  if (!res.ok) {
    throw new Error('Failed to retrieve cinema locations.');
  }
  return await res.json();
}

export async function fetchCinemaById(cinemaId: string): Promise<Cinema> {
  const res = await fetch(`/api/cinemas/${encodeURIComponent(cinemaId)}`);
  if (!res.ok) {
    throw new Error(`Cinema with ID "${cinemaId}" not found.`);
  }
  return await res.json();
}

export async function fetchShowtimes(filters: {
  movieId?: string;
  cinemaId?: string;
  date?: string;
}): Promise<Show[]> {
  const params = new URLSearchParams();
  if (filters.movieId) params.set('movieId', filters.movieId);
  if (filters.cinemaId) params.set('cinemaId', filters.cinemaId);
  if (filters.date) params.set('date', filters.date);

  const res = await fetch(`/api/shows?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve showtimes.');
  }
  return await res.json();
}

export async function fetchShowDetails(showId: string): Promise<Show> {
  const res = await fetch(`/api/shows/${encodeURIComponent(showId)}`);
  if (!res.ok) {
    throw new Error(`Showtime "${showId}" could not be found.`);
  }
  return await res.json();
}

export async function calculateBookingPrice(
  seats: string[],
  couponCode?: string
): Promise<{
  ticketSubtotal: number;
  seatCategories: Record<string, SeatCategory>;
  seatPrices: Record<string, number>;
  convenienceFee: number;
  taxes: number;
  discountAmount: number;
  totalAmount: number;
  appliedCoupon?: string;
}> {
  const res = await fetch('/api/bookings/calculate-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seats, couponCode })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to calculate pricing breakdown.');
  }
  return await res.json();
}

export interface ReserveSeatsResponse {
  success: boolean;
  booking?: Booking;
  conflict?: boolean;
  conflictingSeats?: string[];
  message: string;
}

export async function reserveSeats(payload: {
  showId: string;
  seats: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
  couponCode?: string;
}): Promise<ReserveSeatsResponse> {
  const res = await fetch('/api/bookings/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: 'Unknown response from server.'
  }));

  if (res.status === 409) {
    return {
      success: false,
      conflict: true,
      conflictingSeats: data.conflictingSeats || [],
      message: data.message || 'Selected seats were just booked by another guest.'
    };
  }

  if (!res.ok) {
    return {
      success: false,
      conflict: false,
      message: data.message || 'Failed to reserve seats.'
    };
  }

  return data;
}

export interface CheckoutBookingResponse {
  success: boolean;
  booking?: Booking;
  paymentFailed?: boolean;
  conflict?: boolean;
  conflictingSeats?: string[];
  message: string;
}

export async function checkoutBooking(payload: {
  showId: string;
  seats: string[];
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  couponCode?: string;
  simulateOutcome?: 'success' | 'failure';
  paymentMethodName?: string;
  idempotencyKey?: string;
  idToken?: string;
}): Promise<CheckoutBookingResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (payload.idToken) headers['Authorization'] = `Bearer ${payload.idToken}`;

  const res = await fetch('/api/bookings/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: 'Unknown response received from checkout gateway.'
  }));

  if (res.status === 409) {
    return {
      success: false,
      conflict: true,
      conflictingSeats: data.conflictingSeats || [],
      message: data.message || 'The selected seats were booked right before checkout completed.'
    };
  }

  if (res.status === 402 || data.paymentFailed) {
    return {
      success: false,
      paymentFailed: true,
      booking: data.booking,
      message: data.message || 'Simulated payment was declined. Your card/account was not charged.'
    };
  }

  if (!res.ok) {
    return {
      success: false,
      message: data.message || 'Checkout failed. Please verify guest details and retry.'
    };
  }

  return data;
}

export async function fetchBooking(bookingId: string, idToken?: string): Promise<Booking> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, { headers });
  if (!res.ok) {
    throw new Error(`Booking record "${bookingId}" not found.`);
  }
  return await res.json();
}

export async function fetchUserBookings(
  query: string | { userId?: string; email?: string },
  idToken?: string
): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (typeof query === 'string') {
    params.set('userId', query);
  } else {
    if (query.userId) params.set('userId', query.userId);
    if (query.email) params.set('email', query.email);
  }

  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`/api/bookings?${params.toString()}`, { headers });
  if (!res.ok) {
    throw new Error('Failed to retrieve bookings.');
  }
  return await res.json();
}

export async function cancelBooking(
  bookingId: string,
  idToken?: string
): Promise<{ success: boolean; message: string; releasedSeats?: string[] }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'POST',
    headers
  });
  const data = await res.json().catch(() => ({
    success: false,
    message: 'Failed to cancel booking.'
  }));
  return data;
}

// ==========================================
// ADMIN API CLIENT CALLS
// ==========================================

export async function fetchAdminOverview(idToken?: string) {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch('/api/admin/overview', { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to retrieve admin overview statistics.');
  }
  return await res.json();
}

export async function fetchAdminBookings(idToken?: string): Promise<Booking[]> {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch('/api/admin/bookings', { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to retrieve all bookings.');
  }
  return await res.json();
}

export async function fetchAdminUsers(idToken?: string) {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch('/api/admin/users', { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to retrieve user accounts.');
  }
  return await res.json();
}

export async function createAdminShowApi(showData: Partial<Show>, idToken?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch('/api/admin/shows', {
    method: 'POST',
    headers,
    body: JSON.stringify(showData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to schedule new showtime.');
  }
  return data;
}

export async function deleteAdminShowApi(showId: string, idToken?: string) {
  const headers: Record<string, string> = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(`/api/admin/shows/${encodeURIComponent(showId)}`, {
    method: 'DELETE',
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete showtime.');
  }
  return data;
}


