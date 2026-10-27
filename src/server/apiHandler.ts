import type { IncomingMessage, ServerResponse } from 'node:http';
import { checkRateLimit, getCuratedCollections, getMovieDetails, searchMovies } from './omdbService';
import {
  getCinemas,
  getCinemaById,
  getShowtimes,
  getShowById,
  calculatePricing,
  reserveSeatsAtomic,
  processCheckout,
  getBookingById,
  getBookingsByUser,
  cancelBooking,
  getAllBookings,
  getAdminOverview,
  getAdminUsersList,
  createAdminShow,
  deleteAdminShow,
  createAdminCinema
} from './cinemaService';
import { authenticateRequest } from './authMiddleware';

// Helper to parse JSON request bodies
async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T | null> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      // Guard against overly large payloads (max 1MB)
      if (body.length > 1e6) {
        req.destroy();
        resolve(null);
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method || 'GET';

  // Set standard Security and JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  const requestOrigin = req.headers.origin;
  if (requestOrigin && (requestOrigin === allowedOrigin || requestOrigin === 'http://localhost:5173')) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  // 1. Health check endpoint (GET /api/health)
  if (pathname === '/api/health') {
    const hasKey = Boolean(
      process.env.OMDB_API_KEY &&
      process.env.OMDB_API_KEY !== 'replace_with_your_omdb_api_key' &&
      process.env.OMDB_API_KEY !== 'YOUR_OMDB_API_KEY'
    );

    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'ok',
      service: 'IMovies API Server',
      timestamp: new Date().toISOString(),
      omdbConfigured: hasKey,
      version: '3.0.0',
      cinemaRegion: 'Bhopal, Madhya Pradesh'
    }));
    return true;
  }

  // 2. Curated collections endpoint (GET /api/curated)
  if (pathname === '/api/curated') {
    try {
      const collections = await getCuratedCollections();
      res.statusCode = 200;
      res.end(JSON.stringify(collections));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve curated movie collections.'
      }));
    }
    return true;
  }

  // 3. Movie search endpoint (GET /api/movies/search?q=...&page=...)
  if (pathname === '/api/movies/search') {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'client';
    if (!checkRateLimit(clientIp)) {
      res.statusCode = 429;
      res.end(JSON.stringify({
        Search: [],
        totalResults: '0',
        Response: 'False',
        Error: 'Too many search requests. Please wait a moment before trying again.',
        source: 'demo'
      }));
      return true;
    }

    const q = urlObj.searchParams.get('q') || '';
    const pageStr = urlObj.searchParams.get('page') || '1';
    const page = parseInt(pageStr, 10);

    if (!q.trim()) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        Search: [],
        totalResults: '0',
        Response: 'False',
        Error: 'Missing required query parameter "q".',
        source: 'demo'
      }));
      return true;
    }

    if (q.trim().length > 100) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        Search: [],
        totalResults: '0',
        Response: 'False',
        Error: 'Query parameter "q" exceeds maximum length of 100 characters.',
        source: 'demo'
      }));
      return true;
    }

    try {
      const results = await searchMovies(q.trim(), isNaN(page) ? 1 : page);
      res.statusCode = 200;
      res.end(JSON.stringify(results));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        Search: [],
        totalResults: '0',
        Response: 'False',
        Error: 'An unexpected internal error occurred while searching movies.',
        source: 'demo'
      }));
    }
    return true;
  }

  // 4. Movie details endpoint (GET /api/movies/:imdbId)
  const movieDetailMatch = pathname.match(/^\/api\/movies\/([^/]+)$/);
  if (movieDetailMatch && pathname !== '/api/movies/search') {
    const rawId = decodeURIComponent(movieDetailMatch[1]).trim();

    if (!rawId || (!/^tt\d{5,10}$/.test(rawId) && !rawId.startsWith('tt') && !rawId.startsWith('demo-'))) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        Response: 'False',
        Error: `Invalid IMDb identifier format "${rawId}". Expected format: tt1234567.`
      }));
      return true;
    }

    try {
      const movie = await getMovieDetails(rawId);
      if (!movie) {
        res.statusCode = 404;
        res.end(JSON.stringify({
          Response: 'False',
          Error: `Movie with identifier "${rawId}" not found.`
        }));
        return true;
      }

      res.statusCode = 200;
      res.end(JSON.stringify(movie));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        Response: 'False',
        Error: 'An unexpected error occurred while retrieving movie details.'
      }));
    }
    return true;
  }

  // 5. Cinemas list endpoint (GET /api/cinemas)
  if (pathname === '/api/cinemas' && method === 'GET') {
    const cinemas = getCinemas();
    res.statusCode = 200;
    res.end(JSON.stringify(cinemas));
    return true;
  }

  // 6. Cinema by ID (GET /api/cinemas/:cinemaId)
  const cinemaDetailMatch = pathname.match(/^\/api\/cinemas\/([^/]+)$/);
  if (cinemaDetailMatch && method === 'GET') {
    const cinemaId = decodeURIComponent(cinemaDetailMatch[1]).trim();
    const cinema = getCinemaById(cinemaId);
    if (!cinema) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `Cinema with ID "${cinemaId}" not found.` }));
      return true;
    }
    res.statusCode = 200;
    res.end(JSON.stringify(cinema));
    return true;
  }

  // 7. Showtimes search / filter endpoint (GET /api/shows)
  if (pathname === '/api/shows' && method === 'GET') {
    const movieId = urlObj.searchParams.get('movieId') || undefined;
    const cinemaId = urlObj.searchParams.get('cinemaId') || undefined;
    const date = urlObj.searchParams.get('date') || undefined;

    const shows = getShowtimes({ movieId, cinemaId, date });
    res.statusCode = 200;
    res.end(JSON.stringify(shows));
    return true;
  }

  // 8. Show details endpoint (GET /api/shows/:showId)
  const showDetailMatch = pathname.match(/^\/api\/shows\/([^/]+)$/);
  if (showDetailMatch && method === 'GET') {
    const showId = decodeURIComponent(showDetailMatch[1]).trim();
    const show = getShowById(showId);
    if (!show) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `Show with ID "${showId}" not found.` }));
      return true;
    }
    res.statusCode = 200;
    res.end(JSON.stringify(show));
    return true;
  }

  // 9. Pricing calculation endpoint (POST /api/bookings/calculate-price)
  if (pathname === '/api/bookings/calculate-price' && method === 'POST') {
    const body = await parseJsonBody<{ seats: string[]; couponCode?: string }>(req);
    if (!body || !Array.isArray(body.seats) || body.seats.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Please provide a non-empty array of seat identifiers.' }));
      return true;
    }

    try {
      const pricing = calculatePricing(body.seats, body.couponCode);
      res.statusCode = 200;
      res.end(JSON.stringify(pricing));
    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err?.message || 'Price calculation failed.' }));
    }
    return true;
  }

  // 10. Dedicated Checkout & Payment Simulation Endpoint (POST /api/bookings/checkout)
  if (pathname === '/api/bookings/checkout' && method === 'POST') {
    const body = await parseJsonBody<{
      showId: string;
      seats: string[];
      userId?: string;
      userName?: string;
      userEmail?: string;
      userPhone?: string;
      couponCode?: string;
      simulateOutcome?: 'success' | 'failure';
      paymentMethodName?: string;
      idempotencyKey?: string;
    }>(req);

    if (!body || !body.showId || !Array.isArray(body.seats) || body.seats.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        message: 'Invalid request: "showId" and at least one seat selection are required.'
      }));
      return true;
    }

    const name = (body.userName || '').trim();
    const email = (body.userEmail || '').trim();
    const phone = (body.userPhone || '').trim();

    if (name.length < 2) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        message: 'Guest Full Name must be at least 2 characters.'
      }));
      return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        message: 'Please provide a valid email address for receiving your digital ticket.'
      }));
      return true;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        message: 'Please provide a valid mobile number (10-15 digits) for SMS updates.'
      }));
      return true;
    }

    // Attach authenticated user identity if token present
    const authContext = await authenticateRequest(req);
    const effectiveUserId = authContext?.uid || body.userId;
    const effectiveEmail = authContext?.email || email;

    const simulateOutcome = body.simulateOutcome === 'failure' ? 'failure' : 'success';

    const result = await processCheckout({
      showId: body.showId,
      seats: body.seats,
      userId: effectiveUserId,
      userName: name,
      userEmail: effectiveEmail,
      userPhone: phone,
      couponCode: body.couponCode,
      simulateOutcome,
      paymentMethodName: body.paymentMethodName || 'Demo Payment Simulator',
      idempotencyKey: body.idempotencyKey
    });

    if (!result.success) {
      if ('conflict' in result && result.conflict) {
        res.statusCode = 409;
        res.end(JSON.stringify(result));
        return true;
      }
      if ('paymentFailed' in result && result.paymentFailed) {
        res.statusCode = 402;
        res.end(JSON.stringify(result));
        return true;
      }
      res.statusCode = 400;
      res.end(JSON.stringify(result));
      return true;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return true;
  }

  // 11. Atomic Reservation Endpoint (POST /api/bookings/reserve)
  if (pathname === '/api/bookings/reserve' && method === 'POST') {
    const body = await parseJsonBody<{
      showId: string;
      seats: string[];
      userId?: string;
      userName?: string;
      userEmail?: string;
      userPhone?: string;
      couponCode?: string;
    }>(req);

    if (!body || !body.showId || !Array.isArray(body.seats) || body.seats.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        message: 'Invalid reservation request. "showId" and "seats" are required.'
      }));
      return true;
    }

    const authContext = await authenticateRequest(req);
    const effectiveUserId = authContext?.uid || body.userId;

    const result = await reserveSeatsAtomic({
      ...body,
      userId: effectiveUserId
    });

    if (!result.success) {
      if (result.conflict) {
        res.statusCode = 409;
        res.end(JSON.stringify(result));
        return true;
      }
      res.statusCode = 400;
      res.end(JSON.stringify(result));
      return true;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return true;
  }

  // 12. Booking details (GET /api/bookings/:bookingId)
  const bookingDetailMatch = pathname.match(/^\/api\/bookings\/([^/]+)$/);
  if (bookingDetailMatch && method === 'GET' && pathname !== '/api/bookings/checkout' && pathname !== '/api/bookings/calculate-price') {
    const bookingId = decodeURIComponent(bookingDetailMatch[1]).trim();
    const booking = getBookingById(bookingId);
    if (!booking) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: `Booking with ID or Reference "${bookingId}" not found.` }));
      return true;
    }

    // Security check: If authenticated, only owner or admin can view booking details
    const authContext = await authenticateRequest(req);
    if (authContext && !authContext.isAdmin && authContext.uid !== booking.userId && authContext.email !== booking.userEmail?.toLowerCase()) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'You are not authorized to view this booking.' }));
      return true;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(booking));
    return true;
  }

  // 13. User bookings list (GET /api/bookings?userId=...&email=...)
  if (pathname === '/api/bookings' && method === 'GET') {
    const authContext = await authenticateRequest(req);
    let userId = urlObj.searchParams.get('userId') || '';
    let email = urlObj.searchParams.get('email') || '';

    // If signed in, bind to verified auth identity unless admin
    if (authContext && !authContext.isAdmin) {
      userId = authContext.uid;
      email = authContext.email || email;
    }

    if (!userId && !email) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Query parameter "userId" or "email" is required to list bookings.' }));
      return true;
    }

    const bookings = getBookingsByUser(userId, email);
    res.statusCode = 200;
    res.end(JSON.stringify(bookings));
    return true;
  }

  // 14. Cancel booking endpoint (POST /api/bookings/:bookingId/cancel)
  const bookingCancelMatch = pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/);
  if (bookingCancelMatch && method === 'POST') {
    const bookingId = decodeURIComponent(bookingCancelMatch[1]).trim();
    const booking = getBookingById(bookingId);
    if (!booking) {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, message: 'Booking record not found.' }));
      return true;
    }

    // Authorization check: only booking owner or admin can cancel
    const authContext = await authenticateRequest(req);
    if (authContext && !authContext.isAdmin && authContext.uid !== booking.userId && authContext.email !== booking.userEmail?.toLowerCase()) {
      res.statusCode = 403;
      res.end(JSON.stringify({ success: false, message: 'Unauthorized: You can only cancel your own reservations.' }));
      return true;
    }

    const result = cancelBooking(bookingId);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify(result));
      return true;
    }
    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return true;
  }

  // ==========================================
  // 15. BACKEND-AUTHORIZED ADMINISTRATOR ROUTES
  // ==========================================

  // Admin Overview (GET /api/admin/overview)
  if (pathname === '/api/admin/overview' && method === 'GET') {
    const authContext = await authenticateRequest(req);
    if (!authContext?.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Administrator authorization required.' }));
      return true;
    }

    const overview = getAdminOverview();
    res.statusCode = 200;
    res.end(JSON.stringify(overview));
    return true;
  }

  // Admin Bookings List (GET /api/admin/bookings)
  if (pathname === '/api/admin/bookings' && method === 'GET') {
    const authContext = await authenticateRequest(req);
    if (!authContext?.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Administrator authorization required.' }));
      return true;
    }

    const allBookings = getAllBookings();
    res.statusCode = 200;
    res.end(JSON.stringify(allBookings));
    return true;
  }

  // Admin Users List (GET /api/admin/users)
  if (pathname === '/api/admin/users' && method === 'GET') {
    const authContext = await authenticateRequest(req);
    if (!authContext?.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Administrator authorization required.' }));
      return true;
    }

    const users = getAdminUsersList();
    res.statusCode = 200;
    res.end(JSON.stringify(users));
    return true;
  }

  // Admin Create Showtime (POST /api/admin/shows)
  if (pathname === '/api/admin/shows' && method === 'POST') {
    const authContext = await authenticateRequest(req);
    if (!authContext?.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Administrator authorization required.' }));
      return true;
    }

    const body = await parseJsonBody(req);
    if (!body) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON request payload.' }));
      return true;
    }

    const result = createAdminShow(body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify(result));
      return true;
    }

    res.statusCode = 201;
    res.end(JSON.stringify(result));
    return true;
  }

  // Admin Delete Showtime (DELETE /api/admin/shows/:showId)
  const deleteShowMatch = pathname.match(/^\/api\/admin\/shows\/([^/]+)$/);
  if (deleteShowMatch && method === 'DELETE') {
    const authContext = await authenticateRequest(req);
    if (!authContext?.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Administrator authorization required.' }));
      return true;
    }

    const showId = decodeURIComponent(deleteShowMatch[1]).trim();
    const result = deleteAdminShow(showId);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify(result));
      return true;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return true;
  }

  // Admin Create Cinema (POST /api/admin/cinemas)
  if (pathname === '/api/admin/cinemas' && method === 'POST') {
    const authContext = await authenticateRequest(req);
    if (!authContext?.isAdmin) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Administrator authorization required.' }));
      return true;
    }

    const body = await parseJsonBody(req);
    if (!body) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON request payload.' }));
      return true;
    }

    const result = createAdminCinema(body);
    if (!result.success) {
      res.statusCode = 400;
      res.end(JSON.stringify(result));
      return true;
    }

    res.statusCode = 201;
    res.end(JSON.stringify(result));
    return true;
  }

  return false;
}
