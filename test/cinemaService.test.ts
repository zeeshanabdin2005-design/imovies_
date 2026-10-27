import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSeatIds,
  calculatePricing,
  processCheckout,
  cancelBooking,
  getBookingById,
  getShowById,
  getShowtimes,
  getCinemas,
  getAdminOverview,
  getAdminUsersList,
  createAdminShow
} from '../src/server/cinemaService';
import type { Show } from '../src/types';

describe('Cinema Service - Pricing & Validation', () => {
  it('validates seat identifiers correctly', () => {
    // Valid cases
    assert.equal(validateSeatIds(['A1', 'A2', 'C10']).valid, true);
    assert.equal(validateSeatIds(['J12', 'F6']).valid, true);

    // Empty list
    assert.equal(validateSeatIds([]).valid, false);

    // Exceeds maximum 8 seats limit
    assert.equal(
      validateSeatIds(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']).valid,
      false
    );

    // Duplicate seats
    assert.equal(validateSeatIds(['A1', 'a1']).valid, false);

    // Out of bounds rows or columns
    assert.equal(validateSeatIds(['K1']).valid, false);
    assert.equal(validateSeatIds(['A13']).valid, false);
    assert.equal(validateSeatIds(['A0']).valid, false);
    assert.equal(validateSeatIds(['invalid']).valid, false);
  });

  it('calculates seat prices, convenience fees, and GST authoritatively', () => {
    // A1 = Regular (₹200)
    // F1 = Premium (₹320)
    // J1 = Recliner (₹480)
    const pricing = calculatePricing(['A1', 'F1', 'J1']);

    assert.equal(pricing.ticketSubtotal, 200 + 320 + 480); // 1000
    assert.equal(pricing.seatCategories['A1'], 'regular');
    assert.equal(pricing.seatCategories['F1'], 'premium');
    assert.equal(pricing.seatCategories['J1'], 'recliner');
    assert.equal(pricing.convenienceFee, 3 * 35); // 105
    // Taxable = 1000 + 105 = 1105. Taxes = 18% of 1105 = 199
    assert.equal(pricing.taxes, Math.round(1105 * 0.18));
    assert.equal(pricing.totalAmount, 1105 + Math.round(1105 * 0.18));
  });

  it('applies promotional coupons accurately and respects caps', () => {
    // IMOVIES50: 50% discount capped at ₹300
    const p1 = calculatePricing(['A1', 'A2'], 'IMOVIES50');
    assert.equal(p1.discountAmount, 200);

    const p2 = calculatePricing(['J1', 'J2'], 'IMOVIES50');
    assert.equal(p2.discountAmount, 300);

    // FIRSTSHOW: flat ₹100 discount
    const p3 = calculatePricing(['A1'], 'FIRSTSHOW');
    assert.equal(p3.discountAmount, 100);

    // Invalid coupon code is ignored
    const p4 = calculatePricing(['A1'], 'FAKECOUPON');
    assert.equal(p4.discountAmount, 0);
  });
});

describe('Cinema Service - Concurrency, Booking Lifecycle & Idempotency', () => {
  let testShow: Show;

  before(() => {
    const timeStr = `${Math.floor(10 + Math.random() * 10)}:${Math.floor(10 + Math.random() * 40)}`;
    const created = createAdminShow({
      movieImdbId: 'tt0816692',
      movieTitle: 'Interstellar Automated Test',
      cinemaId: 'cinema-cinepolis-dbcity',
      date: '2026-12-31',
      time: timeStr
    });
    assert.ok(created.success);
    testShow = created.show!;
  });

  it('handles simulated payment failure safely without claiming seats', async () => {
    const result = await processCheckout({
      showId: testShow.id,
      seats: ['A8', 'A9'],
      userName: 'Test Failure User',
      userEmail: 'fail@example.com',
      userPhone: '9876543210',
      simulateOutcome: 'failure'
    });

    assert.equal(result.success, false);
    if (!result.success && result.paymentFailed) {
      assert.ok(result.message.includes('Simulated Payment Declined'));
      assert.equal(result.booking?.status, 'payment_failed');

      // Check that show.bookedSeats DOES NOT contain A8 or A9
      const updatedShow = getShowById(testShow.id);
      assert.ok(!updatedShow?.bookedSeats.includes('A8'));
      assert.ok(!updatedShow?.bookedSeats.includes('A9'));
    } else {
      assert.fail('Expected paymentFailed to be true');
    }
  });

  it('completes successful booking, updates seat inventory, and generates unique reference', async () => {
    const testSeats = ['B1', 'B2'];

    const result = await processCheckout({
      showId: testShow.id,
      seats: testSeats,
      userName: 'Aarav Test',
      userEmail: 'aarav@example.com',
      userPhone: '9893012345',
      simulateOutcome: 'success',
      paymentMethodName: 'Demo UPI'
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.booking.status, 'confirmed');
      assert.ok(result.booking.bookingReference.startsWith('IMO-'));
      assert.deepEqual(result.booking.seats, testSeats);

      // Verify show was updated
      const updatedShow = getShowById(testShow.id);
      assert.ok(updatedShow?.bookedSeats.includes('B1'));
      assert.ok(updatedShow?.bookedSeats.includes('B2'));
    }
  });

  it('detects concurrent double-booking conflict (HTTP 409) on already reserved seats', async () => {
    // Attempt to book seats that were already claimed (B1)
    const result = await processCheckout({
      showId: testShow.id,
      seats: ['B1', 'B3'],
      userName: 'Concurrent Guest',
      userEmail: 'concurrent@example.com',
      userPhone: '9123456789',
      simulateOutcome: 'success'
    });

    assert.equal(result.success, false);
    if (!result.success && 'conflict' in result && result.conflict) {
      assert.deepEqual(result.conflictingSeats, ['B1']);
      assert.ok(result.message.includes('just booked by another guest'));
    } else {
      assert.fail('Expected conflict response for already booked seat B1');
    }
  });

  it('enforces idempotency on repeated requests with same idempotencyKey', async () => {
    const key = `test_idem_${Date.now()}_${Math.random()}`;

    const res1 = await processCheckout({
      showId: testShow.id,
      seats: ['B8'],
      userName: 'Idem Guest',
      userEmail: 'idem@example.com',
      userPhone: '9876543210',
      simulateOutcome: 'success',
      idempotencyKey: key
    });

    assert.equal(res1.success, true);

    // Repeated request with same idempotencyKey
    const res2 = await processCheckout({
      showId: testShow.id,
      seats: ['B8'],
      userName: 'Idem Guest',
      userEmail: 'idem@example.com',
      userPhone: '9876543210',
      simulateOutcome: 'success',
      idempotencyKey: key
    });

    assert.equal(res2.success, true);
    if (res1.success && res2.success) {
      assert.equal(res1.booking.id, res2.booking.id);
      assert.equal(res1.booking.bookingReference, res2.booking.bookingReference);
    }
  });

  it('cancels booking and releases seats atomically back to available inventory', async () => {
    const seatsToBook = ['C1', 'C2'];

    const bookResult = await processCheckout({
      showId: testShow.id,
      seats: seatsToBook,
      userName: 'Cancel Test User',
      userEmail: 'canceltest@example.com',
      userPhone: '9876543210',
      simulateOutcome: 'success'
    });

    assert.equal(bookResult.success, true);
    if (!bookResult.success) return;

    const bookingId = bookResult.booking.id;

    // Show must have C1, C2
    let currentShow = getShowById(testShow.id);
    assert.ok(currentShow?.bookedSeats.includes('C1'));

    // Cancel
    const cancelRes = cancelBooking(bookingId);
    assert.equal(cancelRes.success, true);

    // Verified released
    currentShow = getShowById(testShow.id);
    assert.ok(!currentShow?.bookedSeats.includes('C1'));
    assert.ok(!currentShow?.bookedSeats.includes('C2'));

    const updatedBooking = getBookingById(bookingId);
    assert.equal(updatedBooking?.status, 'cancelled');
  });

  it('provides admin overview and aggregated customer metrics', () => {
    const overview = getAdminOverview();
    assert.ok(typeof overview.totalBookings === 'number');
    assert.ok(typeof overview.totalRevenue === 'number');
    assert.ok(overview.totalShows > 0);
    assert.ok(overview.totalCinemas > 0);

    const users = getAdminUsersList();
    assert.ok(Array.isArray(users));
  });
});
