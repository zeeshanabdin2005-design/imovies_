export interface MovieSummary {
  imdbID: string;
  title: string;
  Title?: string;
  year: string;
  Year?: string;
  type: string;
  Type?: string;
  poster: string;
  Poster?: string;
  genre?: string;
  Genre?: string;
  imdbRating?: string;
  plot?: string;
  Plot?: string;
  source?: 'omdb' | 'demo';
}

export interface MovieDetail {
  imdbID: string;
  title: string;
  Title?: string;
  year: string;
  Year?: string;
  rated: string;
  Rated?: string;
  released: string;
  Released?: string;
  runtime: string;
  Runtime?: string;
  genre: string;
  Genre?: string;
  genres?: string[];
  director: string;
  Director?: string;
  writer?: string;
  Writer?: string;
  actors: string;
  Actors?: string;
  plot: string;
  Plot?: string;
  language: string;
  Language?: string;
  country: string;
  Country?: string;
  awards?: string;
  Awards?: string;
  poster: string;
  Poster?: string;
  imdbRating: string;
  totalVotes?: string;
  imdbVotes?: string;
  type?: string;
  Type?: string;
  boxOffice?: string;
  BoxOffice?: string;
  backdropUrl?: string;
  source?: 'omdb' | 'demo';
}

export interface MovieSearchResult {
  Search: MovieSummary[];
  totalResults: string;
  Response: "True" | "False";
  Error?: string;
  source?: 'omdb' | 'demo';
  isFallback?: boolean;
  fallbackNotice?: string;
}

export interface Cinema {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  rating: number;
  totalReviews: number;
  screensCount: number;
  screens: {
    id: string;
    name: string;
    soundSystem: string;
    screenType: string;
    capacity: number;
  }[];
  amenities: string[];
  imageUrl: string;
  phone?: string;
}

export type SeatCategory = 'regular' | 'premium' | 'recliner';

export interface ShowPricing {
  regular: number;
  premium: number;
  recliner: number;
}

export interface Show {
  id: string;
  movieImdbId: string;
  movieTitle: string;
  moviePoster: string;
  cinemaId: string;
  cinemaName: string;
  screenId: string;
  screenName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  format: string; // "2D", "3D", "IMAX 2D", "4DX"
  language: string; // "English", "Hindi"
  pricing: ShowPricing;
  bookedSeats: string[]; // ["A1", "B4", ...]
  totalSeats: number;
  availableSeatsCount: number;
  createdAt?: string;
}

export interface SeatInfo {
  id: string; // e.g. "A1"
  row: string; // "A"
  number: number; // 1
  category: SeatCategory;
  price: number;
  isBooked: boolean;
  isSelected?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'payment_failed' | 'cancelled';
export type PaymentStatus = 'demo_verified' | 'payment_failed' | 'pending';

export interface Booking {
  id: string;
  bookingReference: string; // e.g. "IMO-8491-BHP"
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  showId: string;
  movieImdbId: string;
  movieTitle: string;
  moviePoster: string;
  cinemaId: string;
  cinemaName: string;
  screenName: string;
  showDate: string;
  showTime: string;
  format: string;
  seats: string[];
  seatCategories: Record<string, SeatCategory>;
  ticketSubtotal: number;
  discountAmount: number;
  convenienceFee: number;
  taxes: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  couponCode?: string;
  idempotencyKey?: string;
  createdAt: string;
  cancelledAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

