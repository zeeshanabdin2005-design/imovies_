import type { Cinema, Show, Booking, SeatCategory } from '../types';
import { CURATED_MOVIES } from './omdbService';

export interface SeatDefinition {
  id: string; // e.g. "A1"
  row: string; // "A"
  number: number; // 1
  category: SeatCategory;
  price: number;
}

// 1. Curated Bhopal Cinema Venues
export const BHOPAL_CINEMAS: Cinema[] = [
  {
    id: 'cinema-cinepolis-dbcity',
    name: 'Cinepolis VIP DB City Mall',
    location: 'DB City Mall, Zone-I, Maharana Pratap Nagar, Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    rating: 4.8,
    totalReviews: 4210,
    screensCount: 6,
    screens: [
      { id: 'sc-1', name: 'Audi 1 - 4K Laser (Dolby Atmos)', soundSystem: 'Dolby Atmos', screenType: '4K Laser', capacity: 120 },
      { id: 'sc-2', name: 'Audi 2 - VIP Recliner Suite', soundSystem: 'Dolby 7.1', screenType: 'Laser Pro', capacity: 120 },
      { id: 'sc-3', name: 'Audi 3 - RealD 3D Screen', soundSystem: 'Dolby Atmos', screenType: '3D High Frame', capacity: 120 }
    ],
    amenities: ['Dolby Atmos', 'Plush Recliners', 'In-Seat Dining', 'Free Mall Parking', 'Wheelchair Access'],
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    phone: '+91 755 6644000'
  },
  {
    id: 'cinema-inox-aashima',
    name: 'INOX Aashima Mall',
    location: 'Aashima Mall, Hoshangabad Road, Bawadiya Kalan, Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    rating: 4.6,
    totalReviews: 3120,
    screensCount: 5,
    screens: [
      { id: 'sc-1', name: 'Screen 1 - INSIGNIA Luxe', soundSystem: 'Dolby Atmos', screenType: 'RGB 4K Laser', capacity: 120 },
      { id: 'sc-2', name: 'Screen 2 - Megaplex', soundSystem: 'Dolby 7.1', screenType: 'Standard 2D', capacity: 120 }
    ],
    amenities: ['Dolby Atmos', 'Cafeteria & Snacks', 'Recliner Row', 'Shopping Mall Access', 'Air Conditioned'],
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    phone: '+91 755 4001234'
  },
  {
    id: 'cinema-pvr-aura',
    name: 'PVR Aura Mall',
    location: 'Aura Mall, Gulmohar Colony, Trilanga, Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    rating: 4.5,
    totalReviews: 2480,
    screensCount: 4,
    screens: [
      { id: 'sc-1', name: 'Audi 1 - Prime Surround', soundSystem: 'Dolby 7.1', screenType: 'Digital 2K', capacity: 120 },
      { id: 'sc-2', name: 'Audi 2 - 3D Visualizer', soundSystem: 'Dolby Atmos', screenType: '3D Digital', capacity: 120 }
    ],
    amenities: ['Dolby 7.1', 'Car Parking', 'Online Food Order', 'Prime Seating'],
    imageUrl: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=800&q=80',
    phone: '+91 755 2789000'
  },
  {
    id: 'cinema-mukta-peoples',
    name: "Mukta A2 Cinemas People's Mall",
    location: "People's Campus, Bhanpur Bypass, Karond, Bhopal",
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    rating: 4.4,
    totalReviews: 1890,
    screensCount: 4,
    screens: [
      { id: 'sc-1', name: 'Screen 1 - Grand Audi', soundSystem: 'Dolby 7.1', screenType: 'Silver Screen', capacity: 120 }
    ],
    amenities: ['Theme Park Adjacent', 'Affordable Concessions', 'Dolby Sound', 'Spacious Seating'],
    imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
    phone: '+91 755 4005555'
  }
];

// Helper: Dates for upcoming 5 days (YYYY-MM-DD)
export function getScheduleDates(count = 5): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// Seat pricing tier constants
export const PRICING_TIERS = {
  regular: 200, // Rows A-E
  premium: 320, // Rows F-H
  recliner: 480 // Rows I-J
};

export function getSeatCategoryByRow(row: string): SeatCategory {
  const upper = row.toUpperCase();
  if (['I', 'J'].includes(upper)) return 'recliner';
  if (['F', 'G', 'H'].includes(upper)) return 'premium';
  return 'regular';
}

export function getSeatPrice(seatId: string): { category: SeatCategory; price: number } {
  const row = seatId.charAt(0).toUpperCase();
  const category = getSeatCategoryByRow(row);
  const price = PRICING_TIERS[category];
  return { category, price };
}

// Generate the initial demonstration showtimes
function buildInitialShows(): Map<string, Show> {
  const showsMap = new Map<string, Show>();
  const dates = getScheduleDates(5);
  const timeSlots = ['10:30', '13:45', '17:15', '20:45'];

  BHOPAL_CINEMAS.forEach((cinema) => {
    CURATED_MOVIES.forEach((movie, mIdx) => {
      dates.forEach((dateStr, dIdx) => {
        // Pick 2 showtimes per movie per day per cinema
        const slot1 = timeSlots[(mIdx + dIdx) % timeSlots.length];
        const slot2 = timeSlots[(mIdx + dIdx + 2) % timeSlots.length];

        [slot1, slot2].forEach((time, sIdx) => {
          const screen = cinema.screens[sIdx % cinema.screens.length];
          const cleanCinemaId = cinema.id.replace('cinema-', '');
          const cleanTime = time.replace(':', '');
          const showId = `show-${cleanCinemaId}-${movie.imdbID}-${dateStr}-${cleanTime}`;

          // Seed a few pre-booked demonstration seats
          const bookedSample = ['C4', 'C5', 'F6', 'F7', 'G5'];

          const show: Show = {
            id: showId,
            movieImdbId: movie.imdbID,
            movieTitle: movie.title || movie.Title || 'Movie',
            moviePoster: movie.poster || movie.Poster || '',
            cinemaId: cinema.id,
            cinemaName: cinema.name,
            screenId: screen.id,
            screenName: screen.name,
            date: dateStr,
            time: time,
            format: sIdx === 0 ? '2D' : 'Dolby 3D',
            language: 'English',
            pricing: {
              regular: PRICING_TIERS.regular,
              premium: PRICING_TIERS.premium,
              recliner: PRICING_TIERS.recliner
            },
            bookedSeats: [...bookedSample],
            totalSeats: 120, // 10 rows (A-J) * 12 cols
            availableSeatsCount: 120 - bookedSample.length,
            createdAt: new Date().toISOString()
          };

          showsMap.set(showId, show);
        });
      });
    });
  });

  return showsMap;
}

// In-Memory Show Store & Booking Store (with concurrency locking)
const showsStore: Map<string, Show> = buildInitialShows();
const bookingsStore: Map<string, Booking> = new Map<string, Booking>();
const idempotencyStore: Map<string, Booking> = new Map<string, Booking>();

// Concurrency mutex lock per show ID
const showLocks = new Set<string>();


/**
 * Get all Bhopal cinemas
 */
export function getCinemas(): Cinema[] {
  return BHOPAL_CINEMAS;
}

export function getCinemaById(cinemaId: string): Cinema | null {
  return BHOPAL_CINEMAS.find((c) => c.id === cinemaId) || null;
}

/**
 * Filter showtimes by movieId, cinemaId, and date
 */
export function getShowtimes(filters: {
  movieId?: string;
  cinemaId?: string;
  date?: string;
}): Show[] {
  const result: Show[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const show of showsStore.values()) {
    if (filters.movieId && show.movieImdbId !== filters.movieId) {
      continue;
    }
    if (filters.cinemaId && show.cinemaId !== filters.cinemaId) {
      continue;
    }
    if (filters.date && show.date !== filters.date) {
      continue;
    }
    if (!filters.date && show.date < today) {
      continue; // Filter past shows by default
    }
    result.push(show);
  }

  // Sort by date then time
  return result.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

/**
 * Get a specific show by ID
 */
export function getShowById(showId: string): Show | null {
  return showsStore.get(showId) || null;
}

/**
 * Validate seat IDs (Rows A-J, numbers 1-12)
 */
export function validateSeatIds(seats: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(seats) || seats.length === 0) {
    return { valid: false, error: 'At least one seat must be selected.' };
  }
  if (seats.length > 8) {
    return { valid: false, error: 'A maximum of 8 seats can be reserved per booking.' };
  }

  const validRowRegex = /^[A-Ja-j]$/;
  for (const seat of seats) {
    if (typeof seat !== 'string' || seat.length < 2 || seat.length > 3) {
      return { valid: false, error: `Invalid seat format "${seat}". Expected format e.g. "F5".` };
    }
    const row = seat.charAt(0);
    const num = parseInt(seat.slice(1), 10);
    if (!validRowRegex.test(row) || isNaN(num) || num < 1 || num > 12) {
      return { valid: false, error: `Seat "${seat}" is out of bounds. Valid rows: A-J, numbers: 1-12.` };
    }
  }

  // Check duplicates in selection
  const unique = new Set(seats.map((s) => s.toUpperCase()));
  if (unique.size !== seats.length) {
    return { valid: false, error: 'Duplicate seat numbers in selection.' };
  }

  return { valid: true };
}

/**
 * Server-authoritative Price Calculation
 */
export function calculatePricing(
  seats: string[],
  couponCode?: string
): {
  ticketSubtotal: number;
  seatCategories: Record<string, SeatCategory>;
  seatPrices: Record<string, number>;
  convenienceFee: number;
  taxes: number;
  discountAmount: number;
  totalAmount: number;
  appliedCoupon?: string;
} {
  let subtotal = 0;
  const seatCategories: Record<string, SeatCategory> = {};
  const seatPrices: Record<string, number> = {};

  for (const s of seats) {
    const upperSeat = s.toUpperCase();
    const { category, price } = getSeatPrice(upperSeat);
    seatCategories[upperSeat] = category;
    seatPrices[upperSeat] = price;
    subtotal += price;
  }

  // Handle promotional discounts
  let discountAmount = 0;
  let appliedCoupon: string | undefined = undefined;

  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    if (code === 'IMOVIES50') {
      discountAmount = Math.min(Math.round(subtotal * 0.5), 300);
      appliedCoupon = 'IMOVIES50 (50% Off)';
    } else if (code === 'FIRSTSHOW') {
      discountAmount = Math.min(100, subtotal);
      appliedCoupon = 'FIRSTSHOW (Flat ₹100 Off)';
    } else if (code === 'WEEKEND20') {
      discountAmount = Math.round(subtotal * 0.2);
      appliedCoupon = 'WEEKEND20 (20% Off)';
    }
  }

  // Standard ₹35 convenience fee per ticket
  const convenienceFee = seats.length * 35;
  // Integrated GST 18% on tickets and fee
  const taxableAmount = Math.max(0, subtotal - discountAmount + convenienceFee);
  const taxes = Math.round(taxableAmount * 0.18);
  const totalAmount = Math.max(0, taxableAmount + taxes);

  return {
    ticketSubtotal: subtotal,
    seatCategories,
    seatPrices,
    convenienceFee,
    taxes,
    discountAmount,
    totalAmount,
    appliedCoupon
  };
}

/**
 * Atomic Concurrency-Safe Seat Reservation
/**
 * Process Checkout: Handles guest details validation, server-authoritative pricing,
 * coupon calculation, idempotency protection, and simulated payment outcomes (success / failure).
 */
export async function processCheckout(params: {
  showId: string;
  seats: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  couponCode?: string;
  simulateOutcome: 'success' | 'failure';
  paymentMethodName?: string;
  idempotencyKey?: string;
}): Promise<
  | { success: true; booking: Booking }
  | { success: false; paymentFailed: true; message: string; booking?: Booking }
  | { success: false; paymentFailed?: false; conflict?: boolean; conflictingSeats?: string[]; message: string }
> {
  const {
    showId,
    seats,
    userId,
    userName,
    userEmail,
    userPhone,
    couponCode,
    simulateOutcome,
    paymentMethodName,
    idempotencyKey
  } = params;

  // 1. Idempotency Check: if this idempotency key was already successfully booked, return it
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    const existing = idempotencyStore.get(idempotencyKey)!;
    if (existing.status === 'confirmed') {
      return { success: true, booking: existing };
    }
  }

  // 2. Validate seats syntax & bounds
  const validation = validateSeatIds(seats);
  if (!validation.valid) {
    return { success: false, paymentFailed: false, conflict: false, message: validation.error || 'Invalid seat selection.' };
  }

  const normalizedSeats = seats.map((s) => s.toUpperCase());

  // 3. Locate Showtime
  const show = showsStore.get(showId);
  if (!show) {
    return { success: false, paymentFailed: false, conflict: false, message: `Showtime "${showId}" could not be found.` };
  }

  // 4. Calculate Server-Authoritative Pricing
  const pricing = calculatePricing(normalizedSeats, couponCode);

  const guestId = userId || `guest_${Date.now()}`;
  const guestName = userName?.trim() || 'Guest Explorer';
  const guestEmail = userEmail?.trim() || 'guest@imovies.demo';
  const guestPhone = userPhone?.trim() || '+91 98930 12345';
  const methodLabel = paymentMethodName || 'Demo Payment Simulator';

  // 5. Handle SIMULATED PAYMENT FAILURE
  if (simulateOutcome === 'failure') {
    const failedBookingId = `bk-fail-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const random6 = Math.floor(100000 + Math.random() * 900000);
    const failedBooking: Booking = {
      id: failedBookingId,
      bookingReference: `IMO-${random6}-DEC`,
      userId: guestId,
      userEmail: guestEmail,
      userName: guestName,
      userPhone: guestPhone,
      showId: show.id,
      movieImdbId: show.movieImdbId,
      movieTitle: show.movieTitle,
      moviePoster: show.moviePoster,
      cinemaId: show.cinemaId,
      cinemaName: show.cinemaName,
      screenName: show.screenName,
      showDate: show.date,
      showTime: show.time,
      format: show.format,
      seats: normalizedSeats,
      seatCategories: pricing.seatCategories,
      ticketSubtotal: pricing.ticketSubtotal,
      discountAmount: pricing.discountAmount,
      convenienceFee: pricing.convenienceFee,
      taxes: pricing.taxes,
      totalAmount: pricing.totalAmount,
      status: 'payment_failed',
      paymentStatus: 'payment_failed',
      paymentMethod: `${methodLabel} (Declined Simulation)`,
      couponCode: pricing.appliedCoupon ? couponCode : undefined,
      idempotencyKey,
      createdAt: new Date().toISOString()
    };

    // Store in bookingsStore for transaction history / user retry
    bookingsStore.set(failedBookingId, failedBooking);

    // CRITICAL: Notice that seats are NOT added to show.bookedSeats.
    // They remain completely free for other guests or an immediate retry!
    return {
      success: false,
      paymentFailed: true,
      message: 'Simulated Payment Declined: Transaction simulation failed as requested. Your card was not charged and selected seats remain available.',
      booking: failedBooking
    };
  }

  // 6. Handle SIMULATED PAYMENT SUCCESS (with Concurrency Lock)
  if (showLocks.has(showId)) {
    await new Promise((r) => setTimeout(r, 60));
  }
  showLocks.add(showId);

  try {
    const currentBooked = new Set(show.bookedSeats || []);
    const conflicts = normalizedSeats.filter((s) => currentBooked.has(s));

    if (conflicts.length > 0) {
      return {
        success: false,
        paymentFailed: false,
        conflict: true,
        conflictingSeats: conflicts,
        message: `Seats [${conflicts.join(', ')}] were just booked by another guest. Please select alternative seats.`
      };
    }

    // Atomically claim seats
    show.bookedSeats.push(...normalizedSeats);
    show.availableSeatsCount = Math.max(0, (show.totalSeats || 120) - show.bookedSeats.length);

    // Generate unique confirmed booking
    const bookingId = `bk-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const random6 = Math.floor(100000 + Math.random() * 900000);
    const bookingReference = `IMO-${random6}-BHP`;

    const booking: Booking = {
      id: bookingId,
      bookingReference,
      userId: guestId,
      userEmail: guestEmail,
      userName: guestName,
      userPhone: guestPhone,
      showId: show.id,
      movieImdbId: show.movieImdbId,
      movieTitle: show.movieTitle,
      moviePoster: show.moviePoster,
      cinemaId: show.cinemaId,
      cinemaName: show.cinemaName,
      screenName: show.screenName,
      showDate: show.date,
      showTime: show.time,
      format: show.format,
      seats: normalizedSeats,
      seatCategories: pricing.seatCategories,
      ticketSubtotal: pricing.ticketSubtotal,
      discountAmount: pricing.discountAmount,
      convenienceFee: pricing.convenienceFee,
      taxes: pricing.taxes,
      totalAmount: pricing.totalAmount,
      status: 'confirmed',
      paymentStatus: 'demo_verified',
      paymentMethod: `${methodLabel} (Verified Demo)`,
      couponCode: pricing.appliedCoupon ? couponCode : undefined,
      idempotencyKey,
      createdAt: new Date().toISOString()
    };

    bookingsStore.set(bookingId, booking);

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, booking);
    }

    return { success: true, booking };
  } finally {
    showLocks.delete(showId);
  }
}

/**
 * Atomic Concurrency-Safe Seat Reservation (Backward compatibility alias)
 */
export async function reserveSeatsAtomic(params: {
  showId: string;
  seats: string[];
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  couponCode?: string;
}): Promise<
  | { success: true; booking: Booking }
  | { success: false; conflict: true; conflictingSeats: string[]; message: string }
  | { success: false; conflict: false; message: string }
> {
  const result = await processCheckout({
    ...params,
    simulateOutcome: 'success',
    paymentMethodName: 'Instant Demo Checkout'
  });

  if (result.success) {
    return { success: true, booking: result.booking };
  }

  if ('conflict' in result && result.conflict) {
    return {
      success: false,
      conflict: true,
      conflictingSeats: result.conflictingSeats || [],
      message: result.message
    };
  }

  return {
    success: false,
    conflict: false,
    message: result.message
  };
}

/**
 * Retrieve booking by ID or reference code
 */
export function getBookingById(bookingId: string): Booking | null {
  if (bookingsStore.has(bookingId)) {
    return bookingsStore.get(bookingId)!;
  }
  // Try finding by bookingReference
  for (const b of bookingsStore.values()) {
    if (b.bookingReference === bookingId) {
      return b;
    }
  }
  return null;
}

/**
 * Get all bookings for a user / guest session
 */
export function getBookingsByUser(userId: string, email?: string): Booking[] {
  const result: Booking[] = [];
  const cleanEmail = email?.trim().toLowerCase();

  for (const b of bookingsStore.values()) {
    const userMatch = b.userId === userId;
    const emailMatch = cleanEmail && b.userEmail?.toLowerCase() === cleanEmail;
    if (userMatch || emailMatch) {
      result.push(b);
    }
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Cancel a booking and atomically release its seats back to the show
 */
export function cancelBooking(
  bookingId: string
): { success: boolean; message: string; releasedSeats?: string[] } {
  const booking = getBookingById(bookingId);
  if (!booking) {
    return { success: false, message: 'Booking record not found.' };
  }

  if (booking.status === 'cancelled') {
    return { success: false, message: 'This reservation has already been cancelled.' };
  }

  if (booking.status === 'payment_failed') {
    return { success: false, message: 'Failed payment transactions do not hold active seats and cannot be cancelled.' };
  }

  const show = showsStore.get(booking.showId);
  if (show) {
    const toRelease = new Set(booking.seats);
    show.bookedSeats = show.bookedSeats.filter((s) => !toRelease.has(s));
    show.availableSeatsCount = Math.min(
      show.totalSeats || 120,
      (show.totalSeats || 120) - show.bookedSeats.length
    );
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();

  return {
    success: true,
    message: `Reservation ${booking.bookingReference} cancelled. Seats [${booking.seats.join(', ')}] have been released.`,
    releasedSeats: booking.seats
  };
}

