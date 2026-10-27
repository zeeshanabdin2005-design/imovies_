# IMovies — Premium Movie Ticket Booking Platform

**Tagline:** "Your Next Movie Experience Starts Here."

**IMovies** is a responsive, cinematic movie-ticket-booking web application built with React 19, TypeScript, Vite, Tailwind CSS, Express, and the OMDb API.

---

## 🏛️ Phase 2: OMDb Integration Architecture

The application enforces a secure server-side proxy architecture:

```
[React Frontend]  ──(Internal API: /api/*)──>  [Express Backend]  ──(Private OMDB_API_KEY)──>  [OMDb API]
```

### Key Security & Reliability Measures
1. **Zero Client Leakage:** The `OMDB_API_KEY` is kept strictly on the server and is never transmitted to the browser or prefixed with `VITE_`.
2. **In-Memory Caching:** Search queries are cached for 10 minutes and movie details are cached for 1 hour to prevent redundant requests and conserve OMDb rate limits.
3. **Sliding-Window Rate Limiting:** Built-in rate limiting throttles excessive requests to protect upstream quotas.
4. **Resilient Curated Fallback:** If OMDb experiences transient errors, quota exhaustion, or an unconfigured API key, the platform seamlessly returns a verified demonstration catalog with clear `source: "demo"` status indicators.

---

## ⚙️ Prerequisites & Environment Setup

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### 1. Obtain an OMDb API Key
1. Visit [OMDb API Key Generator](https://www.omdbapi.com/apikey.aspx).
2. Select the free tier (1,000 daily requests) or a patron tier.
3. Verify your email to activate the key.

### 2. Configure Backend Environment
Create a `.env` file in the project root based on `.env.example`:

```env
# OMDb API Key (Server-side only)
OMDB_API_KEY=your_omdb_api_key_here

# Server Port
PORT=3000

# Client Origin (CORS)
CLIENT_ORIGIN=http://localhost:3000
```

*Note: If `OMDB_API_KEY` is not set or omitted, IMovies uses the curated demonstration catalog. Configure your own key privately to enable live OMDb requests.*

---

## 🚀 Running the Application

### Install Dependencies
```bash
npm install
```

### Development Mode
Runs Vite with the Express API server middleware mounted seamlessly on port 3000:
```bash
npm run dev
```

### Production Build & Full-Stack Run
```bash
# Build frontend assets
npm run build

# Start production Express server
npm start
```

### Type Checking & Linting
```bash
npm run lint
```

---

## 🧪 Testing Backend Endpoints

### 1. Test Health Endpoint
Check if the Express API proxy is running:
```bash
curl http://localhost:3000/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "service": "IMovies API Server",
  "timestamp": "2026-10-27T...",
  "omdbConfigured": true,
  "version": "2.0.0"
}
```

### 2. Test Movie Search
Search movies by title query:
```bash
curl "http://localhost:3000/api/movies/search?q=interstellar&page=1"
```
**Expected Response:**
```json
{
  "Search": [
    {
      "imdbID": "tt0816692",
      "title": "Interstellar",
      "year": "2014",
      "type": "movie",
      "poster": "https://...",
      "source": "omdb"
    }
  ],
  "totalResults": "1",
  "Response": "True",
  "source": "omdb"
}
```

### 3. Test Movie Details by IMDb ID
Retrieve full movie details:
```bash
curl "http://localhost:3000/api/movies/tt0816692"
```

### 4. Test Curated Catalog
```bash
curl "http://localhost:3000/api/curated"
```

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Too many search requests` | Rate limiter triggered | Wait 60 seconds before initiating subsequent search bursts. |
| `Demonstration Mode` indicator displayed | OMDb key is invalid or rate limited | Check `OMDB_API_KEY` in `.env` and verify email activation on omdbapi.com. |
| `Movie with identifier not found` | Invalid or malformed IMDb ID | Ensure IDs follow the `tt1234567` format. |
| Missing movie poster | OMDb returned `"N/A"` for poster | Handled automatically by the built-in graceful poster fallback. |


## Phase 5 security and authentication notes

- Email/password registration and login now use Firebase Authentication rather than simulated success messages.
- Google sign-in and guest sign-in use Firebase Authentication providers. Anonymous sign-in must be enabled in the Firebase Authentication console for guest access.
- Public registration always creates a `user` profile. The browser cannot grant itself administrator privileges.
- The `/admin` route requires an authenticated user and a trusted administrator determination. The bootstrap administrator account must use the allowlisted email and have a verified email address, or have an administrator document provisioned through a trusted Firebase Console/Admin SDK workflow.
- The `firestore.rules` file has been tightened. Deploy these rules to the Firebase project before evaluating security. The client cannot create or modify `/admins` records.
- The real `OMDB_API_KEY` value has been removed from `.env.example`. If a previously shared key was active, rotate it with OMDb and keep the replacement only in a private environment variable.
- This remains a prototype. The separate Express `/api/bookings/*` endpoints currently use in-memory booking storage and do not yet verify Firebase ID tokens. Do not deploy those endpoints as a production booking service until server-side token verification, durable database transactions, and ownership checks are added. Firestore client-side seat inventory updates also require migration to a trusted Cloud Function/server endpoint before production use.
- The current environment did not permit a complete dependency installation during this review, so build/lint verification must be rerun in a network-enabled development environment.
