# IMovies Phase 5 Review and Changes

## Changes made in this review
- Wrapped the application in `AuthProvider` so components using `useAuth()` have a provider.
- Replaced the fake-success login page with Firebase email/password authentication, Google sign-in, guest sign-in, and password-reset interaction.
- Replaced the fake-success registration page with Firebase registration and validation.
- Public registration always creates a `user` profile and blocks registration of the bootstrap administrator email.
- Removed the frontend-only Demo Admin privilege path. A client-side toggle cannot grant admin access.
- Added `/admin` route protection and a conditional Admin link for trusted admin users.
- Tightened Firestore rules: only admins can write cinemas and create/delete shows; profile roles cannot be self-elevated; admin membership cannot be modified from the browser; test collection access is denied.
- Moved catalog seeding to a trusted admin-authenticated session.
- Added seat ID validation, duplicate-seat rejection, and an eight-seat limit to the Firestore booking helper.
- Corrected cancellation seat availability count calculation.
- Removed the exposed OMDb key from source and documentation, and removed the automatic embedded-key fallback.
- Fixed a missing closing `];` in `src/data/curatedMovies.ts` that prevented TypeScript parsing.
- Corrected the health endpoint so it reports OMDb configuration truthfully.
- Added documentation about required Firebase setup and remaining prototype limitations.

## Verification performed
- Searched the project for the exposed OMDb key: no matches remain.
- Confirmed login and registration no longer contain fake-success messages.
- Confirmed the application has an AuthProvider and `/admin` route.
- Ran global `tsc --noEmit`: the original syntax error in `curatedMovies.ts` was found and fixed. The next check stops because project dependencies are not installed (`vite/client` type definitions are missing).
- `npm install --no-audit --no-fund` timed out in this environment. A complete build and runtime test could not be verified here.

## Important limitations that remain
1. **Rotate the OMDb API key.** It was embedded in the uploaded project and shared in earlier context. It has been removed from this edited copy, but source cleanup does not invalidate the old key.
2. The Express `/api/bookings/*` endpoints still use in-memory storage and do not yet verify Firebase ID tokens. They are not safe for production use.
3. Firestore seat inventory is still updated directly from the client. Although rules restrict the fields that may change, a trusted server/Cloud Function should own reservation and price validation before production deployment.
4. Firebase settings and rules must be valid in the connected Firebase project. This package cannot enable Firebase Email/Password, Google, or Anonymous providers on your behalf.
5. The bootstrap admin email is `zeeshanabdin2005@gmail.com` and must be verified in Firebase Auth. Alternatively, create an admin membership document using a trusted Firebase Console/Admin SDK process; browser code cannot create it.
6. This is a development prototype, not a production-certified ticketing/payment service. Demo payments are simulations only.
