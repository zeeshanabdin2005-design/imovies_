import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Cinema, Show, Booking, UserProfile, SeatCategory } from '../types';
import { CURATED_MOVIES } from '../data/curatedMovies';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Initial demonstration Bhopal cinema venues
export const INITIAL_BHOPAL_CINEMAS: Cinema[] = [
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
      { id: 'sc-1', name: 'Audi 1 - Dolby Atmos 4K', soundSystem: 'Dolby Atmos', screenType: '4K Laser', capacity: 120 },
      { id: 'sc-2', name: 'Audi 2 - VIP Recliner Suite', soundSystem: 'Dolby 7.1', screenType: 'Laser Pro', capacity: 120 },
      { id: 'sc-3', name: 'Audi 3 - RealD 3D Screen', soundSystem: 'Dolby Atmos', screenType: '3D High Frame', capacity: 120 }
    ],
    amenities: ['Dolby Atmos', 'Plush Recliners', 'Gourmet In-Seat Dining', 'Free Parking', 'Wheelchair Access'],
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

// Helper to generate upcoming date strings YYYY-MM-DD
export function getUpcomingDates(count = 5): { date: string; display: string; dayName: string }[] {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const display = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    dates.push({ date: dateStr, display, dayName });
  }
  return dates;
}

// Generate demonstration shows for Bhopal cinemas
export function generateInitialShows(): Show[] {
  const dates = getUpcomingDates(4);
  const shows: Show[] = [];
  const times = ['10:30', '13:45', '17:15', '20:45'];

  const featuredList = CURATED_MOVIES.slice(0, 6);

  INITIAL_BHOPAL_CINEMAS.forEach(cinema => {
    featuredList.forEach((movie, mIdx) => {
      dates.forEach((dObj, dIdx) => {
        // Pick 2 showtimes per movie per day
        const time1 = times[(mIdx + dIdx) % times.length];
        const time2 = times[(mIdx + dIdx + 2) % times.length];
        
        [time1, time2].forEach((time, tIdx) => {
          const screen = cinema.screens[tIdx % cinema.screens.length];
          const showId = `show-${cinema.id.replace('cinema-', '')}-${movie.imdbID}-${dObj.date}-${time.replace(':', '')}`;
          
          // Seed a few pre-booked demonstration seats
          const bookedSample = ['C4', 'C5', 'F6', 'F7', 'G5'];

          shows.push({
            id: showId,
            movieImdbId: movie.imdbID,
            movieTitle: movie.title || movie.Title || 'Untitled Movie',
            moviePoster: movie.poster || movie.Poster || '',
            cinemaId: cinema.id,
            cinemaName: cinema.name,
            screenId: screen.id,
            screenName: screen.name,
            date: dObj.date,
            time: time,
            format: tIdx === 0 ? '2D' : 'Dolby 3D',
            language: 'English',
            pricing: {
              regular: 200,
              premium: 320,
              recliner: 480
            },
            bookedSeats: bookedSample,
            totalSeats: 120, // 10 rows (A-J) * 12 cols
            availableSeatsCount: 120 - bookedSample.length
          });
        });
      });
    });
  });

  return shows;
}

// Seed Firestore with initial cinemas and shows if empty
export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    const cinemasSnap = await getDocs(collection(db, 'cinemas'));
    if (cinemasSnap.empty) {
      console.log('Seeding Bhopal demonstration cinemas...');
      for (const cinema of INITIAL_BHOPAL_CINEMAS) {
        await setDoc(doc(db, 'cinemas', cinema.id), cinema);
      }
    }

    const showsSnap = await getDocs(collection(db, 'shows'));
    if (showsSnap.empty) {
      console.log('Seeding demonstration showtimes...');
      const initialShows = generateInitialShows();
      // Seed first batch of 24 shows
      for (const show of initialShows.slice(0, 36)) {
        await setDoc(doc(db, 'shows', show.id), show);
      }
    }

    // Administrator documents must be provisioned through a trusted administrative
    // channel. Never bootstrap or elevate an administrator from client-side code.
  } catch (err) {
    console.warn('Seed operation completed or guarded:', err);
  }
}

// Concurrency-safe atomic booking transaction
export async function createBookingAtomic(params: {
  userId: string;
  userEmail: string;
  userName: string;
  showId: string;
  selectedSeats: string[];
  couponCode?: string;
}): Promise<Booking> {
  const { userId, userEmail, userName, showId, selectedSeats, couponCode } = params;

  if (!selectedSeats || selectedSeats.length === 0) {
    throw new Error('Please select at least one seat to proceed with booking.');
  }
  if (selectedSeats.length > 8) {
    throw new Error('You can book a maximum of 8 seats per reservation.');
  }
  if (new Set(selectedSeats).size !== selectedSeats.length ||
      selectedSeats.some((seat) => !/^[A-J](?:[1-9]|1[0-2])$/.test(seat))) {
    throw new Error('The selected seat list contains duplicate or invalid seat IDs.');
  }

  const showRef = doc(db, 'shows', showId);
  const bookingId = `book-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const bookingRef = doc(db, 'bookings', bookingId);
  const bookingReference = `IMO-${Math.floor(100000 + Math.random() * 900000)}-BHP`;

  return await runTransaction(db, async (transaction) => {
    const showDoc = await transaction.get(showRef);
    if (!showDoc.exists()) {
      throw new Error('The selected showtime does not exist or has been removed.');
    }

    const showData = showDoc.data() as Show;
    const currentBookedSeats = new Set(showData.bookedSeats || []);

    // Concurrency conflict check
    const conflictingSeats = selectedSeats.filter(s => currentBookedSeats.has(s));
    if (conflictingSeats.length > 0) {
      throw new Error(`Seats ${conflictingSeats.join(', ')} were just reserved by another guest. Please select alternative seats.`);
    }

    // Determine seat categories and calculate authoritative price
    const seatCategories: Record<string, SeatCategory> = {};
    let subtotal = 0;

    selectedSeats.forEach(seatId => {
      const row = seatId.charAt(0).toUpperCase();
      let cat: SeatCategory = 'regular';
      let price = showData.pricing?.regular || 200;

      if (['F', 'G', 'H'].includes(row)) {
        cat = 'premium';
        price = showData.pricing?.premium || 320;
      } else if (['I', 'J'].includes(row)) {
        cat = 'recliner';
        price = showData.pricing?.recliner || 480;
      }

      seatCategories[seatId] = cat;
      subtotal += price;
    });

    // Handle coupons
    let discount = 0;
    if (couponCode) {
      const codeUpper = couponCode.trim().toUpperCase();
      if (codeUpper === 'IMOVIES50') {
        discount = Math.min(Math.round(subtotal * 0.5), 300);
      } else if (codeUpper === 'FIRSTSHOW') {
        discount = Math.min(100, subtotal);
      } else if (codeUpper === 'WEEKEND20') {
        discount = Math.round(subtotal * 0.2);
      }
    }

    const convenienceFee = Math.round(selectedSeats.length * 35);
    const taxes = Math.round((subtotal - discount + convenienceFee) * 0.18);
    const totalAmount = Math.max(0, subtotal - discount + convenienceFee + taxes);

    const updatedBookedSeats = [...showData.bookedSeats, ...selectedSeats];
    const newAvailableCount = Math.max(0, (showData.totalSeats || 120) - updatedBookedSeats.length);

    // Atomically reserve seats on show
    transaction.update(showRef, {
      bookedSeats: updatedBookedSeats,
      availableSeatsCount: newAvailableCount
    });

    const newBooking: Booking = {
      id: bookingId,
      bookingReference,
      userId,
      userEmail,
      userName,
      showId,
      movieImdbId: showData.movieImdbId,
      movieTitle: showData.movieTitle,
      moviePoster: showData.moviePoster,
      cinemaId: showData.cinemaId,
      cinemaName: showData.cinemaName,
      screenName: showData.screenName,
      showDate: showData.date,
      showTime: showData.time,
      format: showData.format,
      seats: selectedSeats,
      seatCategories,
      ticketSubtotal: subtotal,
      discountAmount: discount,
      convenienceFee,
      taxes,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'demo_verified',
      paymentMethod: 'IMovies Instant Demo Checkout',
      couponCode: couponCode || undefined,
      createdAt: new Date().toISOString()
    };

    transaction.set(bookingRef, newBooking);
    return newBooking;
  });
}

// Atomically cancel booking and release seats
export async function cancelBookingAtomic(bookingId: string, userId: string, isAdmin = false): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);

  await runTransaction(db, async (transaction) => {
    const bookingDoc = await transaction.get(bookingRef);
    if (!bookingDoc.exists()) {
      throw new Error('Booking not found.');
    }

    const bookingData = bookingDoc.data() as Booking;
    if (!isAdmin && bookingData.userId !== userId) {
      throw new Error('Unauthorized to cancel this booking.');
    }

    if (bookingData.status === 'cancelled') {
      throw new Error('This booking is already cancelled.');
    }

    // Update booking status
    transaction.update(bookingRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

    // Release seats from show
    const showRef = doc(db, 'shows', bookingData.showId);
    const showDoc = await transaction.get(showRef);
    if (showDoc.exists()) {
      const showData = showDoc.data() as Show;
      const releasedSeats = new Set(bookingData.seats || []);
      const remainingSeats = (showData.bookedSeats || []).filter(s => !releasedSeats.has(s));
      transaction.update(showRef, {
        bookedSeats: remainingSeats,
        availableSeatsCount: Math.max(0, (showData.totalSeats || 120) - remainingSeats.length)
      });
    }
  });
}
