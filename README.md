# IMovies — Premium Movie Ticket Booking Platform

**Tagline:** "Your Next Movie Experience Starts Here."

**IMovies** is a responsive, cinematic movie-ticket-booking full-stack web application built with React 19, TypeScript, Vite, Tailwind CSS, Express, Cloud Firestore, Firebase Authentication, and the OMDb API.

---

## 🏛️ Application Architecture

The application enforces a secure full-stack server-authoritative architecture:

```
[React 19 Frontend (SPA)]
   │
   ├─► [Express Backend (/api/*)]
   │      ├─► Auth Middleware (Token verification, RBAC, Admin check)
   │      ├─► Cinema & Showtime Service (Seat validation, pricing, coupons)
   │      ├─► Durable JSON Store (data/database.json - persistence across restarts)
   │      ├─► Concurrency Control (Show mutex locks, conflict prevention)
   │      └─► OMDb API Proxy (Rate-limiting, caching, private key isolation)
   │
   └─► [Firebase / Cloud Firestore (ai-studio-a4954843-5377-43c6-b522-bb0dcc785a17)]
          ├─► Firebase Auth (Google Sign-In, Email/Password, Sessions)
          ├─► Firestore Security Rules (ABAC Zero-Trust rules, role protection)
          └─► Synchronized Bookings Collection
```

### Key Security & Reliability Measures
1. **Server-Authoritative Pricing & Seat Integrity:** All seat prices, discounts, GST (18%), convenience fees (₹35/ticket), and promotional coupons are calculated strictly on the backend. Client-submitted prices are never trusted.
2. **Double-Booking & Race Condition Prevention:** Simultaneous reservation requests for the same showtime are serialized via backend concurrency locks, returning HTTP 409 Conflict if seats were claimed.
3. **Durable Persistence Across Server Restarts:** All bookings, seat reservations, and showtimes are persisted to `data/database.json`. Server restarts or crashes never lose confirmed reservations.
4. **Idempotency Protection:** Repeated payment or checkout requests with the same idempotency key return the existing confirmed booking without charging or reserving duplicate tickets.
5. **Zero Client Key Leakage:** `OMDB_API_KEY` is kept strictly server-side and is never exposed in browser bundles.
6. **Backend-Enforced Admin Authorization:** `/api/admin/*` endpoints strictly require verified administrator credentials (`zeeshanabdin2005@gmail.com` or `riz190175@gmail.com`).

---

## ⚙️ Environment Variables & Setup

Create a `.env` file in the project root based on `.env.example`:

```env
# OMDb API Key (Server-side only)
OMDB_API_KEY=your_omdb_api_key_here

# Server Port (Default: 3000)
PORT=3000

# Client Origin for CORS
CLIENT_ORIGIN=http://localhost:3000

# Firebase Project Configuration (Loaded automatically from firebase-applet-config.json)
FIREBASE_PROJECT_ID=dauntless-champion-4xjsq
```

*Note: If `OMDB_API_KEY` is not provided, IMovies uses the curated demonstration catalog with full showtimes, seat maps, and checkout simulation.*

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Runs Vite with the Express API server middleware on port 3000:
```bash
npm run dev
```

### 3. Production Build & Full-Stack Run
```bash
# Build frontend SPA
npm run build

# Start production server
npm start
```

### 4. Type Checking & Code Quality
```bash
npm run lint
```

### 5. Automated Verification Test Suite
Runs the built-in Node.js test suite verifying pricing, coupons, concurrency, idempotency, failure simulation, cancellation, and admin authorization:
```bash
npm test
```

---

## 🧪 Testing Backend Endpoints

### 1. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

### 2. Test Movie Search
```bash
curl "http://localhost:3000/api/movies/search?q=interstellar&page=1"
```

### 3. Test Showtimes
```bash
curl "http://localhost:3000/api/shows"
```

### 4. Test Server-Authoritative Price Calculation
```bash
curl -X POST http://localhost:3000/api/bookings/calculate-price \
  -H "Content-Type: application/json" \
  -d '{"seats":["A1","F1","J1"],"couponCode":"IMOVIES50"}'
```

### 5. Test Admin Overview (Requires Admin Authorization)
```bash
curl http://localhost:3000/api/admin/overview \
  -H "Authorization: Bearer <ID_TOKEN>"
```

---

## 🎟️ Available Demo Promotional Coupons

- `IMOVIES50`: 50% discount on ticket subtotal (capped at ₹300).
- `FIRSTSHOW`: Flat ₹100 discount on booking.
- `WEEKEND20`: 20% discount on ticket subtotal.
