# IMovies Firestore Security Specification

## 1. Data Invariants
- Cinemas are publicly readable catalog items; only administrators can create, update, or delete cinema records.
- Shows are publicly readable showtime records; only authenticated users can update booked seats during valid checkout transactions, and only administrators can create/modify entire show configurations.
- Bookings strictly belong to the user who created them (`userId == request.auth.uid`). Users can only list and read their own bookings.
- Bookings cannot be modified arbitrarily once confirmed, except for cancellation rules where permitted (`status` transitioning from 'confirmed' to 'cancelled').
- Users can only read and manage their own user profile (`request.auth.uid == userId`).
- Admin privilege is evaluated against the trusted `/admins/{adminId}` collection or matching bootstrapped administrator email (`zeeshanabdin2005@gmail.com`).
- Normal users cannot alter their role or grant themselves admin rights.

## 2. The "Dirty Dozen" Threat Payloads
1. **Identity Spoofing**: User A attempts to read User B's booking list (`/bookings` where `userId != auth.uid`). Expectation: PERMISSION_DENIED.
2. **Ghost Field Injection**: User attempts to create a booking with an arbitrary unauthorized `isAdmin: true` or `discountMultiplier: 0` field. Expectation: PERMISSION_DENIED.
3. **Price Manipulation**: User attempts to create a booking with `totalAmount: 1` when the show ticket price is 300. Expectation: Server/Rule validation blocks unverified amounts.
4. **Admins Document Poisoning**: Regular user attempts to write to `/admins/{uid}`. Expectation: PERMISSION_DENIED.
5. **Showtime Modification**: Regular user attempts to update ticket pricing or cancel an entire show in `/shows/{showId}`. Expectation: PERMISSION_DENIED.
6. **Double Booking Bypass**: Two clients concurrently claiming the same seat. Concurrency-safe atomic transaction validates `bookedSeats` membership.
7. **PII Scraping**: Anonymous or non-owner user attempting `get` on `/users/{otherUserId}`. Expectation: PERMISSION_DENIED.
8. **Malicious ID Injection**: Client injecting 2KB string or path traversal into path variables. Blocked by `isValidId()`.
9. **Post-Cancellation Resurrection**: Attempting to set an already cancelled booking back to 'confirmed'. Expectation: PERMISSION_DENIED.
10. **Shadow Show Creation**: Non-admin attempting to add new shows. Expectation: PERMISSION_DENIED.
11. **Blanket Query Exploitation**: Unfiltered query on `/bookings` without `userId == request.auth.uid`. Expectation: PERMISSION_DENIED by list rule.
12. **Unauthenticated Show Booking**: Client without valid auth token attempting booking creation. Expectation: PERMISSION_DENIED.
